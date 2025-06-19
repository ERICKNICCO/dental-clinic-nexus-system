
import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Search, Plus, Pill, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { treatmentPricingService } from '../services/treatmentPricingService';

const TreatmentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const allTreatments = treatmentPricingService.getAllTreatments();
  const categories = treatmentPricingService.getCategories();

  // Filter treatments based on search term and category
  const filteredTreatments = allTreatments.filter(treatment => {
    const matchesSearch = treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatment.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || treatment.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Preventive': return 'bg-green-100 text-green-800';
      case 'Restorative': return 'bg-blue-100 text-blue-800';
      case 'Cosmetic': return 'bg-purple-100 text-purple-800';
      case 'Orthodontic': return 'bg-orange-100 text-orange-800';
      case 'Surgical': return 'bg-red-100 text-red-800';
      case 'Diagnostic': return 'bg-yellow-100 text-yellow-800';
      case 'Anesthesia': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search treatments..."
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Plus className="mr-2" />
            Add Treatment
          </Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Treatment</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTreatments.map((treatment) => (
            <TableRow key={treatment.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <Pill className="w-4 h-4 mr-2 text-blue-500" />
                  {treatment.name}
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate">{treatment.description}</div>
              </TableCell>
              <TableCell>{treatment.duration}</TableCell>
              <TableCell className="font-semibold">
                <span className={treatment.basePrice === 0 ? 'text-green-600' : 'text-blue-600'}>
                  {treatmentPricingService.formatPrice(treatment.basePrice)}
                </span>
              </TableCell>
              <TableCell>
                <Badge className={getCategoryColor(treatment.category)}>
                  {treatment.category}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {treatment.remarks || '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">View</Button>
                <Button variant="ghost" size="sm">Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {filteredTreatments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No treatments found</h3>
          <p className="text-sm">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search criteria or filter selection.'
              : 'No treatments available at the moment.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TreatmentList;
