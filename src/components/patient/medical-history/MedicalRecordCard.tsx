
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Edit, Save, X, Trash2, Calendar, User, FileText, Stethoscope } from 'lucide-react';
import { MedicalRecord } from '../../../services/medicalHistoryService';

interface MedicalRecordCardProps {
  record: MedicalRecord;
  isEditing: boolean;
  editData: Partial<MedicalRecord>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onEditDataChange: (data: Partial<MedicalRecord>) => void;
  canEdit: boolean;
}

const MedicalRecordCard: React.FC<MedicalRecordCardProps> = ({
  record,
  isEditing,
  editData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditDataChange,
  canEdit
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="condition" className="text-sm font-medium text-gray-700">
                  Condition
                </Label>
                <Input
                  id="condition"
                  value={editData.condition || ''}
                  onChange={(e) => onEditDataChange({...editData, condition: e.target.value})}
                  placeholder="Enter condition"
                  className="text-lg font-semibold"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  {record.condition}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(record.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{record.doctor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Date:
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={editData.date || ''}
                  onChange={(e) => onEditDataChange({...editData, date: e.target.value})}
                  className="w-auto"
                />
              </div>
            ) : (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {new Date(record.date).toLocaleDateString()}
              </Badge>
            )}
            
            {canEdit && (
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={onSave} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-6">
          {/* Description Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Description
              </Label>
            </div>
            {isEditing ? (
              <Textarea
                value={editData.description || ''}
                onChange={(e) => onEditDataChange({...editData, description: e.target.value})}
                placeholder="Enter detailed description..."
                className="min-h-[100px] resize-none"
                rows={4}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-gray-700 leading-relaxed">{record.description}</p>
              </div>
            )}
          </div>

          {/* Treatment Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Treatment
              </Label>
            </div>
            {isEditing ? (
              <Textarea
                value={editData.treatment || ''}
                onChange={(e) => onEditDataChange({...editData, treatment: e.target.value})}
                placeholder="Enter treatment details..."
                className="min-h-[100px] resize-none"
                rows={4}
              />
            ) : (
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <p className="text-gray-700 leading-relaxed">{record.treatment}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalRecordCard;
