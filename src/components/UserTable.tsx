import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import CreateUserModal from "./CreateUserModal";

interface User {
  id: string;
  email: string;
  tier: string;
  subscription_id?: string;
  [key: string]: any;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<Partial<User>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: true,
    email: true,
    tier: true,
    actions: true,
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [planNames, setPlanNames] = useState<Record<number, string>>({});

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, plan_name');

      if (error) throw error;
      
      const planMap = (data || []).reduce((acc, plan) => ({
        ...acc,
        [plan.id]: plan.plan_name
      }), {});
      
      setPlanNames(planMap);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  // Fetch users from Supabase
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, current_plan");

      console.log(data);
      if (error) {
        console.error("Error fetching users:", error);
      } else if (data) {
        setUsers(data);
      }
    } catch (err) {
      console.error("Unexpected error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof User, value: string) => {
    setEditUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (rowIndex: number) => {
    setEditIndex(rowIndex);
    setEditUser({
      ...users[rowIndex],
      current_plan: users[rowIndex].current_plan || null
    });
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditUser({});
  };

  const handleSave = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          current_plan: editUser.current_plan
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh the users list
      await fetchUsers();
      handleCancel();
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  const handleDelete = (userId: string) => {
    alert("Delete functionality would go here in the full implementation");
  };

  const columnHelper = createColumnHelper<User>();

  const columns: ColumnDef<User, any>[] = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => <div className="truncate max-w-[100px]">{info.getValue()}</div>,
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => {
        const rowIndex = info.row.index;
        const isEditing = editIndex === rowIndex;
        const currentEmail = info.getValue() as string;

        return isEditing ? (
          <input
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            type="email"
            value={editUser.email ?? currentEmail}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        ) : (
          currentEmail
        );
      },
    }),
    columnHelper.accessor("current_plan", {
      header: "Plan",
      cell: ({ row, getValue }) => {
        const rowIndex = row.index;
        const isEditing = editIndex === rowIndex;
        const planId = getValue() as number;
        const planName = planId ? planNames[planId] : 'N/A';

        return isEditing ? (
          <select
            value={editUser.current_plan || ''}
            onChange={(e) => handleChange("current_plan", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-800 text-white"
          >
            <option value="">No Plan</option>
            {Object.entries(planNames).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          planName
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {
        const rowIndex = row.index;
        const isEditing = editIndex === rowIndex;

        return (
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleSave(row.original.id)}
                  className="text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm whitespace-nowrap"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="text-white bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-sm whitespace-nowrap"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleEditClick(rowIndex)}
                  className="text-blue-600 hover:underline text-sm whitespace-nowrap"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(row.original.id)}
                  className="text-red-600 hover:underline text-sm whitespace-nowrap"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        );
      },
      header: "Actions",
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Users</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Create User
          </button>
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
          >
            {showColumnSelector ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>Toggle Columns</span>
          </button>
          
          {showColumnSelector && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
              <div className="p-2 space-y-2">
                {table.getAllLeafColumns().map(column => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-x-auto border rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            Scroll horizontally to see more columns
          </div>
        </div>
      )}
      
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
