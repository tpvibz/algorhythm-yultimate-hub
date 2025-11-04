import React, { useEffect, useState } from 'react';
import { useTranslate } from '@/hooks/useTranslate';

type Props = {
  children: string;
  placeholder?: string;
  className?: string;
};

const Translate: React.FC<Props> = ({ children, placeholder = '', className }) => {
  const { t } = useTranslate();
  const [text, setText] = useState(children);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const out = await t(children);
      if (mounted) setText(out);
    })();
    return () => { mounted = false; };
  }, [children, t]);

  return <span className={className}>{text || placeholder}</span>;
};

export default Translate;


