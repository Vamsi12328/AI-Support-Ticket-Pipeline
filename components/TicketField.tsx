import React from 'react';

interface TicketFieldProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactElement;
}

const TicketField: React.FC<TicketFieldProps> = ({ title, children, icon }) => {
  return (
    <div className="border-b border-slate-700/50 pb-4 last:border-b-0">
      <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
        {icon && React.cloneElement(icon, { className: "w-5 h-5 text-slate-500"})}
        {title}
      </h3>
      <div className="text-slate-300">{children}</div>
    </div>
  );
};

export default TicketField;
