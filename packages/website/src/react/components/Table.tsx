import { useState } from 'react';
import { NBadge, NButton, NTable } from '@nayan-ui/react';
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  Filter,
  Mail,
  MapPin,
  Minus,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Search,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  XCircle
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Table = () => {
  // Basic table data
  const basicColumns = [
    { name: 'invoice', title: 'Invoice', className: 'w-[100px]' },
    { name: 'status', title: 'Status' },
    { name: 'method', title: 'Method' },
    { name: 'amount', title: 'Amount', className: 'text-right' }
  ];

  const basicData = [
    { invoice: 'INV-001', status: 'Paid', method: 'Credit Card', amount: '$1,250.00' },
    { invoice: 'INV-002', status: 'Pending', method: 'Bank Transfer', amount: '$750.50' },
    { invoice: 'INV-003', status: 'Overdue', method: 'PayPal', amount: '$2,100.00' },
    { invoice: 'INV-004', status: 'Paid', method: 'Credit Card', amount: '$890.25' }
  ];

  // Status badge component
  const StatusBadge = (row: any, col: any, rowIndex: number, colIndex: number) => {
    const status = row[col.name];
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'paid':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'overdue':
          return 'bg-red-100 text-red-800';
        case 'cancelled':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-blue-100 text-blue-800';
      }
    };

    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>{status}</span>;
  };

  // Action buttons component
  const ActionButtons = (row: any, col: any, rowIndex: number, colIndex: number) => {
    return (
      <div className="flex items-center space-x-2">
        <button className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded" title="View" onClick={() => handleAction('view', row)}>
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded" title="Edit" onClick={() => handleAction('edit', row)}>
          <Edit className="w-4 h-4" />
        </button>
        <button className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded" title="Delete" onClick={() => handleAction('delete', row)}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // User avatar component
  const UserAvatar = (row: any, col: any, rowIndex: number, colIndex: number) => {
    const user = row[col.name];
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">{user.name.charAt(0)}</div>
        <div>
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </div>
    );
  };

  // Rating component
  const RatingStars = (row: any, col: any, rowIndex: number, colIndex: number) => {
    const rating = row[col.name];
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  // Progress bar component
  const ProgressBar = (row: any, col: any, rowIndex: number, colIndex: number) => {
    const progress = row[col.name];
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm text-gray-600 min-w-[40px]">{progress}%</span>
      </div>
    );
  };

  // Enhanced table with custom components
  const enhancedColumns = [
    { name: 'invoice', title: 'Invoice', className: 'w-[120px]' },
    { name: 'status', title: 'Status', renderCell: StatusBadge },
    { name: 'method', title: 'Payment Method' },
    { name: 'amount', title: 'Amount', className: 'text-right' },
    { name: 'actions', title: 'Actions', className: 'text-center w-[120px]', renderCell: ActionButtons }
  ];

  const enhancedData = [
    { invoice: 'INV-001', status: 'Paid', method: 'Credit Card', amount: '$1,250.00' },
    { invoice: 'INV-002', status: 'Pending', method: 'Bank Transfer', amount: '$750.50' },
    { invoice: 'INV-003', status: 'Overdue', method: 'PayPal', amount: '$2,100.00' },
    { invoice: 'INV-004', status: 'Cancelled', method: 'Credit Card', amount: '$890.25' },
    { invoice: 'INV-005', status: 'Paid', method: 'Stripe', amount: '$1,500.75' }
  ];

  // User management table
  const userColumns = [
    { name: 'user', title: 'User', renderCell: UserAvatar },
    { name: 'role', title: 'Role' },
    { name: 'department', title: 'Department' },
    { name: 'status', title: 'Status', renderCell: StatusBadge },
    { name: 'lastLogin', title: 'Last Login' },
    { name: 'actions', title: 'Actions', className: 'text-center', renderCell: ActionButtons }
  ];

  const userData = [
    {
      user: { name: 'John Doe', email: 'john@example.com' },
      role: 'Admin',
      department: 'Engineering',
      status: 'Active',
      lastLogin: '2 hours ago'
    },
    {
      user: { name: 'Jane Smith', email: 'jane@example.com' },
      role: 'Manager',
      department: 'Marketing',
      status: 'Active',
      lastLogin: '1 day ago'
    },
    {
      user: { name: 'Bob Johnson', email: 'bob@example.com' },
      role: 'Developer',
      department: 'Engineering',
      status: 'Inactive',
      lastLogin: '1 week ago'
    },
    {
      user: { name: 'Alice Brown', email: 'alice@example.com' },
      role: 'Designer',
      department: 'Design',
      status: 'Active',
      lastLogin: '30 minutes ago'
    }
  ];

  // Product table with ratings
  const productColumns = [
    { name: 'name', title: 'Product Name' },
    { name: 'category', title: 'Category' },
    { name: 'price', title: 'Price', className: 'text-right' },
    { name: 'rating', title: 'Rating', renderCell: RatingStars },
    { name: 'stock', title: 'Stock', className: 'text-center' },
    { name: 'actions', title: 'Actions', className: 'text-center', renderCell: ActionButtons }
  ];

  const productData = [
    { name: 'Wireless Headphones', category: 'Electronics', price: '$99.99', rating: 4, stock: 25 },
    { name: 'Smart Watch', category: 'Wearables', price: '$299.99', rating: 5, stock: 12 },
    { name: 'Laptop Stand', category: 'Accessories', price: '$49.99', rating: 3, stock: 8 },
    { name: 'USB-C Cable', category: 'Cables', price: '$19.99', rating: 4, stock: 50 }
  ];

  // Project progress table
  const projectColumns = [
    { name: 'project', title: 'Project Name' },
    { name: 'team', title: 'Team Lead' },
    { name: 'progress', title: 'Progress', renderCell: ProgressBar },
    { name: 'deadline', title: 'Deadline' },
    { name: 'status', title: 'Status', renderCell: StatusBadge },
    { name: 'actions', title: 'Actions', className: 'text-center', renderCell: ActionButtons }
  ];

  const projectData = [
    { project: 'Website Redesign', team: 'Sarah Wilson', progress: 75, deadline: '2024-02-15', status: 'In Progress' },
    { project: 'Mobile App', team: 'Mike Chen', progress: 45, deadline: '2024-03-01', status: 'In Progress' },
    { project: 'API Integration', team: 'David Kim', progress: 90, deadline: '2024-01-30', status: 'Nearly Complete' },
    { project: 'Database Migration', team: 'Lisa Garcia', progress: 100, deadline: '2024-01-15', status: 'Completed' }
  ];

  // Compact table
  const compactColumns = [
    { name: 'id', title: 'ID', className: 'w-[60px]' },
    { name: 'name', title: 'Name' },
    { name: 'email', title: 'Email' },
    { name: 'status', title: 'Status', renderCell: StatusBadge }
  ];

  const compactData = [
    { id: '001', name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: '002', name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: '003', name: 'Bob Johnson', email: 'bob@example.com', status: 'Pending' }
  ];

  // Action tracking
  const [actionHistory, setActionHistory] = useState<
    Array<{
      action: string;
      item: any;
      timestamp: string;
    }>
  >([]);

  const handleAction = (action: string, item: any) => {
    setActionHistory(prev => [
      {
        action,
        item: item.invoice || item.user?.name || item.name || item.project || item.id,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 9) // Keep last 10 actions
    ]);
  };

  const resetActionHistory = () => {
    setActionHistory([]);
  };

  return (
    <ComponentWrapper>
      <div className="space-y-8">
        {/* Basic Table */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Basic Table</h3>
          <p className="text-gray-600 mb-4">Simple table with basic columns and data display for invoices and transactions.</p>
          <div className="bg-white rounded-lg border">
            <NTable className="bg-card" caption="Basic invoice table" columns={basicColumns} data={basicData} />
          </div>
        </section>

        {/* Enhanced Table with Custom Components */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Enhanced Table with Custom Components</h3>
          <p className="text-gray-600 mb-4">Table with custom cell renderers including status badges and action buttons for better interactivity.</p>
          <div className="bg-white rounded-lg border">
            <NTable className="bg-card" caption="Enhanced invoice table with custom components" columns={enhancedColumns} data={enhancedData} />
          </div>
        </section>

        {/* User Management Table */}
        <section>
          <h3 className="text-lg font-semibold mb-4">User Management Table</h3>
          <p className="text-gray-600 mb-4">Comprehensive user management table with avatars, roles, and status indicators.</p>
          <div className="bg-white rounded-lg border">
            <NTable className="bg-card" caption="User management table" columns={userColumns} data={userData} />
          </div>
        </section>

        {/* Product Catalog Table */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Product Catalog Table</h3>
          <p className="text-gray-600 mb-4">Product listing table with ratings, pricing, and inventory management features.</p>
          <div className="bg-white rounded-lg border">
            <NTable className="bg-card" caption="Product catalog table" columns={productColumns} data={productData} />
          </div>
        </section>

        {/* Project Progress Table */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Project Progress Table</h3>
          <p className="text-gray-600 mb-4">Project management table with progress bars, deadlines, and team information.</p>
          <div className="bg-white rounded-lg border">
            <NTable className="bg-card" caption="Project progress table" columns={projectColumns} data={projectData} />
          </div>
        </section>

        {/* Compact Table */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Compact Table</h3>
          <p className="text-gray-600 mb-4">Compact table design for displaying essential information in limited space.</p>
          <div className="bg-white rounded-lg border">
            <NTable className="bg-card text-sm" caption="Compact user table" columns={compactColumns} data={compactData} />
          </div>
        </section>

        {/* Striped Table */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Striped Table</h3>
          <p className="text-gray-600 mb-4">Table with alternating row colors for better readability and visual separation.</p>
          <div className="bg-white rounded-lg border">
            <NTable
              className="bg-card [&_tbody_tr:nth-child(even)]:bg-gray-50"
              caption="Striped table for better readability"
              columns={basicColumns}
              data={basicData}
            />
          </div>
        </section>

        {/* Responsive Table */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Responsive Table</h3>
          <p className="text-gray-600 mb-4">Table with responsive design that adapts to different screen sizes with horizontal scrolling.</p>
          <div className="bg-white rounded-lg border overflow-x-auto">
            <NTable
              className="bg-card min-w-[600px]"
              caption="Responsive table with horizontal scroll"
              columns={enhancedColumns}
              data={enhancedData}
            />
          </div>
        </section>

        {/* Table Best Practices */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Table Best Practices</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Do's</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Use clear, descriptive column headers</li>
                <li>• Implement proper sorting and filtering</li>
                <li>• Provide visual feedback for actions</li>
                <li>• Use consistent alignment (numbers right-aligned)</li>
                <li>• Include loading states for async data</li>
                <li>• Make tables responsive on mobile devices</li>
                <li>• Use zebra striping for better readability</li>
                <li>• Provide accessible table captions</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Don'ts</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Don't overcrowd tables with too many columns</li>
                <li>• Don't use tables for layout purposes</li>
                <li>• Don't forget to handle empty states</li>
                <li>• Don't make action buttons too small</li>
                <li>• Don't ignore keyboard navigation</li>
                <li>• Don't use inconsistent data formatting</li>
                <li>• Don't forget pagination for large datasets</li>
                <li>• Don't neglect mobile responsiveness</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Table Action Summary */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Table Action Summary</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Recent Table Actions</h4>
              <button
                onClick={resetActionHistory}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>

            {actionHistory.length > 0 ? (
              <div className="space-y-2">
                {actionHistory.map((action, index) => (
                  <div key={index} className="flex justify-between items-center text-sm py-2 px-3 bg-white rounded border">
                    <div className="flex items-center space-x-2">
                      {action.action === 'view' && <Eye className="w-4 h-4 text-blue-600" />}
                      {action.action === 'edit' && <Edit className="w-4 h-4 text-green-600" />}
                      {action.action === 'delete' && <Trash2 className="w-4 h-4 text-red-600" />}
                      <span className="font-medium capitalize">{action.action}</span>
                      <span className="text-gray-600">→</span>
                      <span>{action.item}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{action.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MoreHorizontal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No actions performed yet. Try clicking on action buttons in the tables above.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </ComponentWrapper>
  );
};

export default Table;
