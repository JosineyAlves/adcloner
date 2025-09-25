import React from 'react';

interface MetaIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const MetaIcon: React.FC<MetaIconProps> = (props) => (
  <img 
    src="https://static.xx.fbcdn.net/rsrc.php/yb/r/CnOoIyhtLSO.svg" 
    alt="Meta" 
    width="20" 
    height="20"
    {...props}
  />
);

export default MetaIcon;
