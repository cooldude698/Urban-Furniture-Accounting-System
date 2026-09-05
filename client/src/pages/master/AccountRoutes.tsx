import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AccountListPage } from './AccountListPage';
import { AccountFormPage } from './AccountFormPage';
import { ContactListPage } from './ContactListPage';
import { ContactFormPage } from './ContactFormPage';
import { ProductListPage } from './ProductListPage';
import { ProductKanbanPage } from './ProductKanbanPage';
import { ProductFormPage } from './ProductFormPage';
import { JournalListPage } from './JournalListPage';
import { JournalFormPage } from './JournalFormPage';
import { AnalyticListPage } from './AnalyticListPage';
import { AnalyticFormPage } from './AnalyticFormPage';

// ── Chart of Accounts ──
export const AccountListRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AccountListPage
      onSelectAccount={id => navigate(`/account/coa/${id}`)}
      onNewAccount={() => navigate('/account/coa/new')}
    />
  );
};

export const AccountFormRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const accountId = id && id !== 'new' ? parseInt(id, 10) : null;
  return (
    <AccountFormPage
      accountId={accountId}
      onBack={() => navigate('/account/coa')}
      onHome={() => navigate('/account/coa')}
      onSaved={savedId => navigate(`/account/coa/${savedId}`)}
      onNew={() => navigate('/account/coa/new')}
    />
  );
};

// ── Contacts ──
export const ContactListRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ContactListPage
      onSelectContact={id => navigate(`/account/contacts/${id}`)}
      onNewContact={() => navigate('/account/contacts/new')}
      onBack={() => navigate('/account/coa')}
    />
  );
};

export const ContactKanbanRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ContactListPage
      initialViewMode="kanban"
      onSelectContact={id => navigate(`/account/contacts/${id}`)}
      onNewContact={() => navigate('/account/contacts/new')}
      onBack={() => navigate('/account/coa')}
    />
  );
};

export const ContactFormRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contactId = id && id !== 'new' ? parseInt(id, 10) : null;
  return (
    <ContactFormPage
      contactId={contactId}
      onBack={() => navigate('/account/contacts')}
      onHome={() => navigate('/account/contacts')}
      onSaved={savedId => navigate(`/account/contacts/${savedId}`)}
      onNew={() => navigate('/account/contacts/new')}
      onViewBills={() => navigate('/purchase/bills')}
      onViewPOs={() => navigate('/purchase/orders')}
      onViewStatement={cId => navigate(`/purchase/statements/${cId}`)}
    />
  );
};

// ── Products ──
export const ProductListRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ProductListPage
      onSelectProduct={id => navigate(`/account/products/${id}`)}
      onNewProduct={() => navigate('/account/products/new')}
    />
  );
};

export const ProductKanbanRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ProductKanbanPage
      onSelectProduct={id => navigate(`/account/products/${id}`)}
      onNewProduct={() => navigate('/account/products/new')}
      onToggleViewMode={() => navigate('/account/products')}
    />
  );
};

export const ProductFormRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id && id !== 'new' ? parseInt(id, 10) : null;
  return (
    <ProductFormPage
      productId={productId}
      onBack={() => navigate('/account/products')}
      onHome={() => navigate('/account/products')}
      onSaved={savedId => navigate(`/account/products/${savedId}`)}
      onNew={() => navigate('/account/products/new')}
    />
  );
};

// ── Journals ──
export const JournalListRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <JournalListPage
      onSelectJournal={id => navigate(`/account/journals/${id}`)}
      onNewJournal={() => navigate('/account/journals/new')}
    />
  );
};

export const JournalFormRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const journalId = id && id !== 'new' ? parseInt(id, 10) : null;
  return (
    <JournalFormPage
      journalId={journalId}
      onBack={() => navigate('/account/journals')}
      onHome={() => navigate('/account/journals')}
      onSaved={savedId => navigate(`/account/journals/${savedId}`)}
      onNew={() => navigate('/account/journals/new')}
    />
  );
};

// ── Analytic Accounts ──
export const AnalyticListRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AnalyticListPage
      onSelectAnalytic={id => navigate(`/account/analytics/${id}`)}
      onNewAnalytic={() => navigate('/account/analytics/new')}
      onBack={() => navigate('/account/coa')}
    />
  );
};

export const AnalyticKanbanRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AnalyticListPage
      initialViewMode="kanban"
      onSelectAnalytic={id => navigate(`/account/analytics/${id}`)}
      onNewAnalytic={() => navigate('/account/analytics/new')}
      onBack={() => navigate('/account/coa')}
    />
  );
};

export const AnalyticFormRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const analyticId = id && id !== 'new' ? parseInt(id, 10) : null;
  return (
    <AnalyticFormPage
      analyticId={analyticId}
      onBack={() => navigate('/account/analytics')}
      onHome={() => navigate('/account/analytics')}
      onSaved={savedId => navigate(`/account/analytics/${savedId}`)}
      onNew={() => navigate('/account/analytics/new')}
    />
  );
};
