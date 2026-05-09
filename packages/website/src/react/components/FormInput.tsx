'use client';

import { useForm } from 'react-hook-form';
import { NFormInput } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const FormInput = () => {
  const { control } = useForm();

  return (
    <ComponentWrapper>
      <NFormInput label="Email" type="email" placeholder="Enter email" control={control} name="email" />
    </ComponentWrapper>
  );
};

export default FormInput;
