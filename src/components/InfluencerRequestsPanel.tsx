import React, { useState, useEffect } from 'react';
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Loader2, Eye, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InfluencerRequest {
  id: string;
  user_id: string;
  age: string;
  gender: string;
  description: string;
  background: string;
  view_type: string;
  view_format: string;
  voice_description: string;
  generated_image_url: string;
  status: string;
  created_at: string;
  auth_users_view: {
    email: string;
  };
}

interface RequestDetailsModalProps {
  request: InfluencerRequest;
  onClose: () => void;
}

function RequestDetailsModal({ request, onClose }: RequestDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Request Details</h3>
            <p className="text-sm text-gray-300">From: {request.auth_users_view.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2 text-white">Basic Information</h4>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-300">Age Range</dt>
                  <dd className="text-sm font-medium text-white">{request.age}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-300">Gender</dt>
                  <dd className="text-sm font-medium text-white">{request.gender}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-300">View Type</dt>
                  <dd className="text-sm font-medium text-white">{request.view_type}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-300">Format</dt>
                  <dd className="text-sm font-medium text-white">{request.view_format}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-white">Description</h4>
              <p className="text-sm bg-gray-800 p-3 rounded text-white">{request.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-white">Background</h4>
              <p className="text-sm bg-gray-800 p-3 rounded text-white">{request.background}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-white">Voice Description</h4>
              <p className="text-sm bg-gray-800 p-3 rounded text-white">{request.voice_description}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-white">Generated Image</h4>
            <img 
              src={request.generated_image_url} 
              alt="Generated Avatar" 
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InfluencerRequestsPanel() {
  const [requests, setRequests] = useState<InfluencerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<InfluencerRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('influencer_requests')
        .select(`
          *,
          auth_users_view (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this request?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('influencer_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  const columnHelper = createColumnHelper<InfluencerRequest>();

  const columns: ColumnDef<InfluencerRequest, any>[] = [
    columnHelper.accessor('auth_users_view.email', {
      header: 'User Email',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('age', {
      header: 'Age Range',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('gender', {
      header: 'Gender',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('view_type', {
      header: 'View Type',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('created_at', {
      header: 'Created At',
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
    columnHelper.display({
      id: 'preview',
      header: 'Preview',
      cell: ({ row }) => (
        <div className="w-16 h-16 relative">
          <img
            src={row.original.generated_image_url}
            alt="Avatar Preview"
            className="w-full h-full object-cover rounded"
          />
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedRequest(row.original)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteRequest(row.original.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete Request"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: requests,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Influencer Requests</h1>

      {loading ? (
        <div className="flex items-center justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
        </div>
      )}

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}