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
import { Plus, Edit, Trash2, DollarSign, Copy, Upload } from 'lucide-react';
import { supabaseTreatmentPricingService, TreatmentPricing } from '../../services/supabaseTreatmentPricingService';
import { importNHIFPricing } from '../../utils/importNHIFPricing';
import { useToast } from '../../hooks/use-toast';

const TreatmentPricingManagement: React.FC = () => {
  const [treatments, setTreatments] = useState<TreatmentPricing[]>([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentPricing | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState('all');
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    duration: '',
    insuranceProvider: 'cash'
  });
  const { toast } = useToast();

  const categories = [
    'Preventive',
    'Restorative',
    'Surgical', 
    'Cosmetic',
    'Diagnostic',
    'Anesthesia',
    'Orthodontic',
    'Periodontics',
    'Endodontics',
    'Prosthodontics',
    'Emergency',
    'Minor Procedures',
    'Ordinary Procedures',
    'Specialized Procedures',
    'Other'
  ];

  const predefinedInsuranceProviders = [
    { code: 'cash', name: 'Cash' },
    { code: 'NHIF', name: 'NHIF' },
    { code: 'GA', name: 'GA Insurance' },
    { code: 'JUBILEE', name: 'Jubilee Insurance' },
    { code: 'AAR', name: 'AAR Insurance' },
    { code: 'BRITAM', name: 'Britam Insurance' },
    { code: 'MO', name: 'MO Insurance' }
  ];

  useEffect(() => {
    loadTreatments();
    loadInsuranceProviders();
  }, []);

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const data = await supabaseTreatmentPricingService.getTreatments();
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

  const loadInsuranceProviders = async () => {
    try {
      const providers = await supabaseTreatmentPricingService.getInsuranceProviders();
      setInsuranceProviders(providers);
    } catch (error) {
      console.error('Error loading insurance providers:', error);
    }
  };

  const handleImportNHIF = async () => {
    if (window.confirm('This will import NHIF pricing data. Are you sure you want to continue?')) {
      try {
        setImporting(true);
        const importedCount = await importNHIFPricing();
        
        toast({
          title: "Success",
          description: `Successfully imported ${importedCount} NHIF treatments`,
        });
        
        // Reload treatments and insurance providers
        await loadTreatments();
        await loadInsuranceProviders();
        
      } catch (error) {
        console.error('Error importing NHIF pricing:', error);
        toast({
          title: "Error",
          description: "Failed to import NHIF pricing data",
          variant: "destructive",
        });
      } finally {
        setImporting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.basePrice || !formData.category) {
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
        basePrice: parseInt(formData.basePrice),
        category: formData.category,
        duration: parseInt(formData.duration) || 30,
        insuranceProvider: formData.insuranceProvider,
        isActive: true
      };

      if (editingTreatment) {
        await supabaseTreatmentPricingService.updateTreatment(editingTreatment.id, treatmentData);
        toast({
          title: "Success",
          description: "Treatment pricing updated successfully",
        });
      } else {
        await supabaseTreatmentPricingService.addTreatment(treatmentData);
        toast({
          title: "Success",
          description: "Treatment pricing added successfully",
        });
      }

      resetForm();
      setIsModalOpen(false);
      loadTreatments();
      loadInsuranceProviders();
    } catch (error) {
      console.error('Error saving treatment:', error);
      toast({
        title: "Error",
        description: "Failed to save treatment pricing",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (treatment: TreatmentPricing) => {
    setEditingTreatment(treatment);
    setFormData({
      name: treatment.name,
      description: treatment.description || '',
      basePrice: treatment.basePrice.toString(),
      category: treatment.category,
      duration: treatment.duration.toString(),
      insuranceProvider: treatment.insuranceProvider
    });
    setIsModalOpen(true);
  };

  const handleCopyTreatment = (treatment: TreatmentPricing) => {
    setEditingTreatment(null);
    setFormData({
      name: treatment.name,
      description: treatment.description || '',
      basePrice: treatment.basePrice.toString(),
      category: treatment.category,
      duration: treatment.duration.toString(),
      insuranceProvider: 'cash' // Default to cash for copying
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this treatment pricing?')) {
      try {
        await supabaseTreatmentPricingService.deleteTreatment(id);
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
      basePrice: '',
      category: '',
      duration: '',
      insuranceProvider: 'cash'
    });
    setEditingTreatment(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Filter treatments by selected insurance provider
  const filteredTreatments = selectedInsurance === 'all' 
    ? treatments 
    : treatments.filter(t => t.insuranceProvider === selectedInsurance);

  const getInsuranceColor = (provider: string) => {
    switch (provider) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'NHIF': return 'bg-blue-100 text-blue-800';
      case 'GA': return 'bg-purple-100 text-purple-800';
      case 'JUBILEE': return 'bg-orange-100 text-orange-800';
      case 'AAR': return 'bg-red-100 text-red-800';
      case 'BRITAM': return 'bg-yellow-100 text-yellow-800';
      case 'MO': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <p className="text-gray-600">Manage treatment prices for cash and insurance patients</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleImportNHIF} 
            disabled={importing}
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100"
          >
            <Upload className="mr-2 h-4 w-4" />
            {importing ? 'Importing...' : 'Import NHIF Prices'}
          </Button>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Treatment
          </Button>
        </div>
      </div>

      {/* Filter by Insurance Provider */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Payment Type:</Label>
            <Select value={selectedInsurance} onValueChange={setSelectedInsurance}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Types</SelectItem>
                {predefinedInsuranceProviders.map((provider) => (
                  <SelectItem key={provider.code} value={provider.code}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Treatment Pricing List
            {selectedInsurance !== 'all' && (
              <Badge className={getInsuranceColor(selectedInsurance)}>
                {predefinedInsuranceProviders.find(p => p.code === selectedInsurance)?.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTreatments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No treatments found</h3>
              <p className="text-sm mb-4">
                {selectedInsurance === 'all' 
                  ? 'Add your first treatment pricing to get started.'
                  : `No treatments found for ${predefinedInsuranceProviders.find(p => p.code === selectedInsurance)?.name}.`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Treatment Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell className="font-medium">{treatment.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{treatment.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getInsuranceColor(treatment.insuranceProvider)}>
                        {predefinedInsuranceProviders.find(p => p.code === treatment.insuranceProvider)?.name || treatment.insuranceProvider}
                      </Badge>
                    </TableCell>
                    <TableCell>{treatment.duration} min</TableCell>
                    <TableCell className="font-semibold">
                      {supabaseTreatmentPricingService.formatPrice(treatment.basePrice)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{treatment.description}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyTreatment(treatment)}
                        className="mr-2"
                        title="Copy treatment for different insurance"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
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
                placeholder="e.g., Consultation"
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
              <Label htmlFor="insuranceProvider">Payment Type *</Label>
              <Select value={formData.insuranceProvider} onValueChange={(value) => setFormData({ ...formData, insuranceProvider: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedInsuranceProviders.map((provider) => (
                    <SelectItem key={provider.code} value={provider.code}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="basePrice">Price (Tsh) *</Label>
              <Input
                id="basePrice"
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="e.g., 30000"
                min="0"
                step="1000"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 30"
                min="1"
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
