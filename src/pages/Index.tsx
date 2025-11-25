import { ReactNode } from 'react';
import { CondominiosProvider } from '@/context/CondominiosContext';
import { AtivosProvider } from '@/context/AtivosContext';
import { CondominiosPage } from './CondominiosPage';

interface IndexProps {
  children?: ReactNode;
}

const Index = ({ children }: IndexProps) => {
  return (
    <CondominiosProvider>
      <AtivosProvider>
        {children || <CondominiosPage />}
      </AtivosProvider>
    </CondominiosProvider>
  );
};

export default Index;
