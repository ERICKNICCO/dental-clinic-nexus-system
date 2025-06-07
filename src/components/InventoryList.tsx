
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock inventory data
const mockInventory = [
  { id: 1, name: "Dental Filling Material", category: "Materials", stock: 48, unit: "packs", reorderLevel: 10 },
  { id: 2, name: "Anesthetic Solution", category: "Medications", stock: 35, unit: "vials", reorderLevel: 8 },
  { id: 3, name: "Dental Probes", category: "Instruments", stock: 12, unit: "units", reorderLevel: 5 },
  { id: 4, name: "Examination Gloves", category: "PPE", stock: 200, unit: "boxes", reorderLevel: 20 },
  { id: 5, name: "Dental Masks", category: "PPE", stock: 150, unit: "boxes", reorderLevel: 15 },
  { id: 6, name: "Dental Burs", category: "Instruments", stock: 86, unit: "packs", reorderLevel: 10 },
  { id: 7, name: "Impression Material", category: "Materials", stock: 28, unit: "sets", reorderLevel: 6 },
  { id: 8, name: "Sterilization Pouches", category: "Supplies", stock: 120, unit: "boxes", reorderLevel: 15 },
];

const categories = ["All", "Materials", "Medications", "Instruments", "PPE", "Supplies"];

const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredInventory = mockInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = mockInventory.filter(item => item.stock <= item.reorderLevel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search inventory..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(category => (
              <Button 
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className="text-xs px-3 py-1 h-auto"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="bg-white rounded-md shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.stock <= item.reorderLevel ? 'bg-red-100 text-red-800' : 
                        item.stock <= item.reorderLevel * 1.5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.stock}
                      </span>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.reorderLevel}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="low-stock" className="space-y-4">
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableCaption>Items below reorder level</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.stock}
                      </span>
                    </TableCell>
                    <TableCell>{item.reorderLevel}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Reorder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryList;
