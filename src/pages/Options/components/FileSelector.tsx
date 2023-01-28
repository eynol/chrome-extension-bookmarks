import React, { useEffect, useState, useRef, useCallback } from 'react'



const FileSelectorWraper: React.FC<{
    onChange: (file: File) => void,
    children?: React.ReactElement;
}> = (props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleClicked = useCallback(() => {
        inputRef.current?.click();
    }, [])
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            props.onChange(e.target.files[0]);
        }
        // clear input value
        inputRef.current?.value && (inputRef.current.value = '');
    }, [props.onChange])

    return <>
        <input ref={inputRef} onChange={handleChange} type="file" hidden></input>
        {React.Children.only(props.children) &&
            props.children &&
            React.cloneElement(props.children, {
                onClick: handleClicked,
            })}
    </>
};

FileSelectorWraper.displayName = 'FileSelectorWraper'
export default FileSelectorWraper;