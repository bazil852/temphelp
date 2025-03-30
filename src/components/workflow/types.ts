export interface NodeData {
    label: string;
    type: string;
    config: any;
  }
  
  export interface WorkflowNode {
    id: string;
    type: string;
    data: NodeData;
  }
  
  export interface NodeTypeConfig {
    type: string;
    label: string;
    icon: React.ReactNode;
    configFields: {
      name: string;
      label: string;
      type: 'text' | 'select' | 'number';
      options?: { value: string; label: string }[];
    }[];
  }