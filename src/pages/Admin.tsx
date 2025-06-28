import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import OrdersList from '@/components/admin/OrdersList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiService } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showClearFilesDialog, setShowClearFilesDialog] = useState(false);
  const [showClearOrdersDialog, setShowClearOrdersDialog] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (!adminLoggedIn) {
      navigate('/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const downloadAllFiles = () => {
    toast.info("Download all files feature will be implemented with proper file management");
  };

  const clearAllFiles = async () => {
    try {
      await apiService.clearAllFiles();
      toast.success("All uploaded files have been cleared");
      setShowClearFilesDialog(false);
    } catch (error) {
      toast.error("Failed to clear files");
    }
  };

  const clearAllOrders = async () => {
    try {
      await apiService.clearAllOrders();
      toast.success("All orders have been cleared");
      setShowClearOrdersDialog(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to clear orders");
    }
  };
  
  if (!isLoggedIn) {
    return null;
  }

  return (
    <PageLayout>
      <div className="py-6 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">
                Manage orders and settings
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
          
          <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 sm:mb-8 w-full sm:w-auto">
              <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
              <TabsTrigger value="files" className="text-xs sm:text-sm">Files</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">All Orders</h2>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto text-sm"
                  onClick={() => setShowClearOrdersDialog(true)}
                >
                  <Trash2 className="h-4 w-4" /> Clear All Orders
                </Button>
              </div>
              <OrdersList />
            </TabsContent>
            <TabsContent value="settings" className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Settings</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-700 text-sm sm:text-base">Database Storage</h3>
                  <p className="mt-1 text-gray-600 text-sm">Orders and files are now stored in the hosting service's database. 
                  All data is persistent and shared across all admin sessions.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-700 text-sm sm:text-base">Admin Credentials</h3>
                  <p className="mt-1 text-gray-600 text-sm">Username: admin | Password: xerox123</p>
                  <p className="text-xs text-gray-500 mt-1">This is for demonstration purposes only. In a real app, you would use secure credential storage.</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="files" className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">File Management</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 text-sm"
                    onClick={downloadAllFiles}
                  >
                    <Download className="h-4 w-4" /> Download All
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 text-sm"
                    onClick={() => setShowClearFilesDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Clear All Files
                  </Button>
                </div>
              </div>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">File management interface</p>
                <p className="text-sm text-gray-400 mt-2">Files are stored on the hosting service and can be downloaded from individual orders</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={showClearFilesDialog} onOpenChange={setShowClearFilesDialog}>
        <AlertDialogContent className="mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all uploaded files? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllFiles} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
              Yes, Clear All Files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearOrdersDialog} onOpenChange={setShowClearOrdersDialog}>
        <AlertDialogContent className="mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all orders? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllOrders} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
              Yes, Clear All Orders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default Admin;