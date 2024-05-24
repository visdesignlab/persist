import React from 'react';

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
        src={lightImageSrc}
        className={lightClassName}
      />
      <img 
        style={style}
        alt="Example banner"
        src={darkImageSrc}
        className={darkClassName}
      />
    </>
  )
}

export default ImageSwitcher;