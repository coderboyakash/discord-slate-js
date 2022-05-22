import React, { Fragment } from 'react'

const Image = ({ attributes, children, element }) => {
  return (
    <Fragment>
      <div {...attributes}>
        {children} 
        <div
          contentEditable={false}
        >
          <img
            className='emoji-image'
            src={element.url}
          />
        </div>
      </div>
    </Fragment>
  )
}

export default Image