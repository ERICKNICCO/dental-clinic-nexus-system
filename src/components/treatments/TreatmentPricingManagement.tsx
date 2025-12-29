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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Plus, Edit, Trash2, DollarSign, Copy, Upload } from 'lucide-react';
import { supabaseTreatmentPricingService, TreatmentPricing } from '../../services/supabaseTreatmentPricingService';
import { useToast } from '../../hooks/use-toast';
import { importGAPricing } from '../../utils/importGAPricing';
import { importJubileePricing } from '../../utils/importJubileePricing';
import { toSentenceCase } from '../../lib/utils';
import { getJubileeProcedureCodeForTreatment } from '../../services/jubileeTreatmentCodes';

const TreatmentPricingManagement: React.FC = () => {
  const [treatments, setTreatments] = useState<TreatmentPricing[]>([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentPricing | null>(null);
  const [activeTab, setActiveTab] = useState('cash');
  const [importingGA, setImportingGA] = useState(false);
  const [importingJubilee, setImportingJubilee] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
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

  const paymentMethods = [
    { code: 'cash', name: 'Cash' },
    // NHIF is the technical code; Strategis is the business name
    { code: 'NHIF', name: 'Strategis' },
    { code: 'GA', name: 'GA Insurance' },
    { code: 'JUBILEE', name: 'Jubilee Insurance' },
    { code: 'MO', name: 'MO Insurance' },
    { code: 'ASSEMBLE', name: 'Assemble' },
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

  const handleImportGA = async () => {
    try {
      setImportingGA(true);
      const result = await importGAPricing();
      toast({
        title: "Success",
        description: `Successfully imported ${result.count} GA insurance treatments`,
      });
      loadTreatments();
    } catch (error) {
      console.error('Error importing GA pricing:', error);
      toast({
        title: "Error",
        description: "Failed to import GA pricing",
        variant: "destructive",
      });
    } finally {
      setImportingGA(false);
    }
  };

  const handleImportJubilee = async () => {
    try {
      setImportingJubilee(true);
      const result = await importJubileePricing();
      toast({
        title: "Success",
        description: `Successfully imported ${result.count} Jubilee insurance treatments`,
      });
      loadTreatments();
    } catch (error) {
      console.error('Error importing Jubilee pricing:', error);
      toast({
        title: "Error",
        description: "Failed to import Jubilee pricing",
        variant: "destructive",
      });
    } finally {
      setImportingJubilee(false);
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
        await supabaseTreatmentPricingService.addTreatment({
          ...treatmentData,
          duration: 30 // default duration
        });
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
      insuranceProvider: activeTab // Use current active tab as default
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
      insuranceProvider: activeTab // Use current active tab as default
    });
    setEditingTreatment(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const getTreatmentsByPaymentMethod = (paymentMethod: string) => {
    // Use the same normalization logic as the Supabase service so that
    // minor variations like "CASH", "cash " etc. are grouped correctly.
    const target = supabaseTreatmentPricingService.normalizeInsuranceProvider(paymentMethod);
    return treatments.filter(
      (t) =>
        supabaseTreatmentPricingService.normalizeInsuranceProvider(t.insuranceProvider) === target,
    );
  };

  const getPaymentMethodColor = (provider: string) => {
    switch (provider) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'NHIF': return 'bg-blue-100 text-blue-800';        // Strategis
      case 'GA': return 'bg-purple-100 text-purple-800';
      case 'JUBILEE': return 'bg-orange-100 text-orange-800';
      case 'MO': return 'bg-indigo-100 text-indigo-800';
      case 'ASSEMBLE': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Add helper to extract NHIF code from description
  function extractNhifCode(description: string): { code: string, description: string } {
    if (!description) return { code: '', description: '' };
    const match = description.match(/nhif item code[:：]?\s*(\d+)/i);
    if (match) {
      // Remove the code part from the description
      const newDesc = description.replace(match[0], '').replace(/^[-.,\s]+/, '').trim();
      return { code: match[1], description: newDesc };
    }
    return { code: '', description };
  }

  const renderTreatmentTable = (paymentMethod: string) => {
    const filteredTreatments = getTreatmentsByPaymentMethod(paymentMethod);
    const paymentMethodInfo = paymentMethods.find(p => p.code === paymentMethod);

    if (filteredTreatments.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No treatments found</h3>
          <p className="text-sm mb-4">
            No treatments found for {paymentMethodInfo?.name}.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              onClick={handleAddNew}
              className="bg-[#d8ae2d] hover:bg-[#c39b28] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Treatment for {paymentMethodInfo?.name}
            </Button>
            {paymentMethod === 'GA' && (
              <Button 
                onClick={handleImportGA} 
                disabled={importingGA}
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                {importingGA ? 'Importing...' : 'Import GA Prices'}
              </Button>
            )}
            {paymentMethod === 'JUBILEE' && (
              <Button 
                onClick={handleImportJubilee} 
                disabled={importingJubilee}
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                {importingJubilee ? 'Importing...' : 'Import Jubilee Prices'}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Treatment Name</TableHead>
            <TableHead>Category</TableHead>
            {paymentMethod === 'NHIF' && <TableHead>Code</TableHead>}
            {paymentMethod === 'JUBILEE' && <TableHead>Code</TableHead>}
            <TableHead>Price</TableHead>
            {paymentMethod !== 'NHIF' && <TableHead>Description</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTreatments.map((treatment) => {
            let code = '';
            let desc = treatment.description;
            if (paymentMethod === 'NHIF') {
              const result = extractNhifCode(treatment.description);
              code = result.code;
              desc = result.description;
            }
            const jubileeProcCode =
              paymentMethod === 'JUBILEE'
                ? getJubileeProcedureCodeForTreatment(treatment.name)
                : '';

            return (
            <TableRow key={treatment.id}>
                <TableCell className="font-medium">{toSentenceCase(treatment.name)}</TableCell>
              <TableCell>
                  <Badge variant="secondary">{toSentenceCase(treatment.category)}</Badge>
              </TableCell>
                {paymentMethod === 'NHIF' && <TableCell>{code}</TableCell>}
                {paymentMethod === 'JUBILEE' && <TableCell>{jubileeProcCode}</TableCell>}
              <TableCell className="font-semibold">
                {supabaseTreatmentPricingService.formatPrice(treatment.basePrice)}
              </TableCell>
                {paymentMethod !== 'NHIF' && (
              <TableCell className="max-w-xs">
                    <div className="truncate">{toSentenceCase(desc)}</div>
              </TableCell>
                )}
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
            );
          })}
        </TableBody>
      </Table>
    );
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
          <p className="text-gray-600">Manage treatment prices for different payment methods</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddNew}
            className="bg-[#d8ae2d] hover:bg-[#c39b28] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Treatment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Treatment Pricing by Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* 6 payment methods: Cash, Strategis, GA, Jubilee, MO, Assemble */}
            <TabsList className="grid w-full grid-cols-6">
              {paymentMethods.map((method) => (
                <TabsTrigger key={method.code} value={method.code} className="text-sm">
                  {method.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {paymentMethods.map((method) => (
              <TabsContent key={method.code} value={method.code} className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getPaymentMethodColor(method.code)}>
                      {method.name}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {getTreatmentsByPaymentMethod(method.code).length} treatments
                    </span>
                  </div>
                </div>
                {renderTreatmentTable(method.code)}
              </TabsContent>
            ))}
          </Tabs>
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
              <Label htmlFor="insuranceProvider">Payment Method *</Label>
              <Select value={formData.insuranceProvider} onValueChange={(value) => setFormData({ ...formData, insuranceProvider: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.code} value={method.code}>
                      {method.name}
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
