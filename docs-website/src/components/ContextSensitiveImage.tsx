import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

interface ContextSensitiveImageProps {
  src: string,
  style?: React.CSSProperties,
  className?: string
}

const ContextSensitiveImage = ({src,style,className} : ContextSensitiveImageProps) => {
  const imageUrl = useBaseUrl(src)
  return (
    <>
      <img 
        style={style}
        alt="Example banner"
        src={imageUrl}
        className={className}
      />
    </>
  )
}

export default ContextSensitiveImage;