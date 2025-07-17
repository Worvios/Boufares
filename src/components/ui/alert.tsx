import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from './card';

export const Alert: React.FC<{ message: string; className?: string }> = ({ message, className = '' }) => (
  <Card className={`flex items-center gap-3 bg-red-50 border-red-300 text-red-800 p-3 ${className}`}>
    <AlertTriangle className="w-5 h-5 text-red-500" />
    <span>{message}</span>
  </Card>
);

export default Alert; 