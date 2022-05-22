import React from 'react'
import Image from './Image'
import Mention from './Mention'
const Element = props => {
  const { attributes, children, element } = props
  switch (element.type) {
    case 'image':
      return <Image {...props} />
    case 'mention':
      return <Mention {...props} />
    default:
      return <div {...attributes}>{children}</div>
  }
}
export default Element