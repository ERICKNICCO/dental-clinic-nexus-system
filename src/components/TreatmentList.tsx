
import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Search, Plus, Pill } from 'lucide-react';

interface Treatment {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: string;
  category: string;
}

const TreatmentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample treatment data
  const treatments: Treatment[] = [
    {
      id: 1,
      name: 'Dental Cleaning',
      description: 'Professional cleaning to remove plaque and tartar',
      duration: '30 mins',
      price: '$80',
      category: 'Preventive'
    },
    {
      id: 2,
      name: 'Root Canal',
      description: 'Treatment for infected pulp in the root of a tooth',
      duration: '90 mins',
      price: '$800',
      category: 'Restorative'
    },
    {
      id: 3,
      name: 'Teeth Whitening',
      description: 'Professional whitening treatment',
      duration: '60 mins',
      price: '$350',
      category: 'Cosmetic'
    },
    {
      id: 4,
      name: 'Dental Implant',
      description: 'Artificial tooth root placed into the jaw',
      duration: '120 mins',
      price: '$1,500',
      category: 'Restorative'
    },
    {
      id: 5,
      name: 'Braces Adjustment',
      description: 'Regular adjustment of dental braces',
      duration: '45 mins',
      price: '$200',
      category: 'Orthodontic'
    }
  ];

  // Filter treatments based on search term
  const filteredTreatments = treatments.filter(treatment => 
    treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    treatment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    treatment.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search treatments..."
            className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>
          <Plus className="mr-2" />
          Add Treatment
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTreatments.map((treatment) => (
            <TableRow key={treatment.id}>
              <TableCell className="font-medium flex items-center">
                <Pill className="w-4 h-4 mr-2 text-blue-500" />
                {treatment.name}
              </TableCell>
              <TableCell>{treatment.description}</TableCell>
              <TableCell>{treatment.duration}</TableCell>
              <TableCell>{treatment.price}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  treatment.category === 'Preventive' ? 'bg-green-100 text-green-800' :
                  treatment.category === 'Restorative' ? 'bg-blue-100 text-blue-800' :
                  treatment.category === 'Cosmetic' ? 'bg-purple-100 text-purple-800' :
                  treatment.category === 'Orthodontic' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {treatment.category}
                </span>
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
          No treatments found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default TreatmentList;
