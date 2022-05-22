import React from 'react'
import Image from './Image'
const Element = props => {
  const { attributes, children, element } = props
  switch (element.type) {
    case 'image':
      return <Image {...props} />
    default:
      return <div {...attributes}>{children}</div>
  }
}
export default Element