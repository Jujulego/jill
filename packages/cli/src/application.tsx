import { Text } from 'ink';
import { Children, FC } from 'react';

// Types
export interface ApplicationProps {
  name: string;
}

// Component
export const Application: FC<ApplicationProps> = ({ name, children }) => {
  return (
    <>
      <Text>Running cli { name }</Text>
      <Text>Detected { Children.count(children) } commands</Text>
    </>
  );
};
