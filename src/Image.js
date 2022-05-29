import React, { Fragment } from 'react'

const Image = ({ attributes, children, element }) => {
  return (
    <Fragment>
      <span {...attributes}>
        {children} 
        <span
          contentEditable={false}
        >
          <img
            className='emoji-image'
            src={element.url}
          />
        </span>
      </span>
    </Fragment>
  )
}

export default Image