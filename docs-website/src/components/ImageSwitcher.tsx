import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

interface ImageSwitcherProps {
  lightImageSrc: string,
  darkImageSrc: string,
  style?: React.CSSProperties,
  className?: string
}

const ImageSwitcher = ({lightImageSrc,darkImageSrc,style,className} : ImageSwitcherProps) => {
  let darkClassName = 'dark-theme-display-component';
  let lightClassName = 'light-theme-display-component';
  
  if(className){
    darkClassName = darkClassName + ' ' + className;
    lightClassName = lightClassName + ' ' + className;
  }

  return (
    <>
      <img 
        style={style}
        alt="Example banner"
        src={useBaseUrl(lightImageSrc)}
        className={lightClassName}
      />
      <img 
        style={style}
        alt="Example banner"
        src={useBaseUrl(darkImageSrc)}
        className={darkClassName}
      />
    </>
  )
}

export default ImageSwitcher;