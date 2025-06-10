
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { treatmentPricingFirebaseService } from '../../services/treatmentPricingFirebaseService';
import { useToast } from '../../hooks/use-toast';

const TreatmentPricingManagement: React.FC = () => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    duration: '',
    remarks: ''
  });
  const { toast } = useToast();

  const categories = [
    'Preventive Care',
    'Restorative',
    'Oral Surgery',
    'Orthodontics',
    'Periodontics',
    'Endodontics',
    'Prosthodontics',
    'Cosmetic',
    'Emergency',
    'Other'
  ];

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const data = await treatmentPricingFirebaseService.getAllTreatmentPricing();
      setTreatments(data);
    } catch (error) {
      console.error('Error loading treatments:', error);
      toast({
        title: "Error",
        description: "Failed to load treatment pricing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const treatmentData = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        duration: formData.duration,
        remarks: formData.remarks
      };

      if (editingTreatment) {
        await treatmentPricingFirebaseService.updateTreatmentPricing(editingTreatment.id, treatmentData);
        toast({
          title: "Success",
          description: "Treatment pricing updated successfully",
        });
      } else {
        await treatmentPricingFirebaseService.addTreatmentPricing(treatmentData);
        toast({
          title: "Success",
          description: "Treatment pricing added successfully",
        });
      }

      resetForm();
      setIsModalOpen(false);
      loadTreatments();
    } catch (error) {
      console.error('Error saving treatment:', error);
      toast({
        title: "Error",
        description: "Failed to save treatment pricing",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (treatment: any) => {
    setEditingTreatment(treatment);
    setFormData({
      name: treatment.name,
      description: treatment.description,
      price: treatment.price.toString(),
      category: treatment.category,
      duration: treatment.duration,
      remarks: treatment.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this treatment pricing?')) {
      try {
        await treatmentPricingFirebaseService.deleteTreatmentPricing(id);
        toast({
          title: "Success",
          description: "Treatment pricing deleted successfully",
        });
        loadTreatments();
      } catch (error) {
        console.error('Error deleting treatment:', error);
        toast({
          title: "Error",
          description: "Failed to delete treatment pricing",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      duration: '',
      remarks: ''
    });
    setEditingTreatment(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <span>Loading treatment pricing...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Treatment Pricing Management</h2>
          <p className="text-gray-600">Manage treatment prices and categories</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Treatment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Treatment Pricing List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {treatments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No treatments found</h3>
              <p className="text-sm">Add your first treatment pricing to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Treatment Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell className="font-medium">{treatment.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{treatment.category}</Badge>
                    </TableCell>
                    <TableCell>{treatment.duration}</TableCell>
                    <TableCell className="font-semibold">
                      {treatmentPricingFirebaseService.formatPrice(treatment.price)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{treatment.description}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(treatment)}
                        className="mr-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(treatment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? 'Edit Treatment Pricing' : 'Add New Treatment Pricing'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Treatment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Teeth Cleaning"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="price">Price (Tsh) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., 50000"
                min="0"
                step="1000"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 30 minutes"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the treatment"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Additional notes or remarks"
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingTreatment ? 'Update' : 'Add'} Treatment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreatmentPricingManagement;
