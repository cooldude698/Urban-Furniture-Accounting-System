import React from 'react';
import { ProductListPage } from './ProductListPage';

interface ProductKanbanPageProps {
  onSelectProduct: (id: number) => void;
  onNewProduct: () => void;
  onToggleViewMode?: () => void;
}

export const ProductKanbanPage: React.FC<ProductKanbanPageProps> = ({
  onSelectProduct,
  onNewProduct,
  onToggleViewMode,
}) => {
  return (
    <ProductListPage
      initialViewMode="kanban"
      onSelectProduct={onSelectProduct}
      onNewProduct={onNewProduct}
      onBack={onToggleViewMode}
    />
  );
};

