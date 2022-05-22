import React, { useMemo } from 'react'
import { Transforms, createEditor, Descendant } from 'slate'
import {Slate,Editable,useSlateStatic,useSelected,useFocused,withReact,ReactEditor} from 'slate-react'
import { withHistory } from 'slate-history'
import imageExtensions from 'image-extensions'
import isUrl from 'is-url'
import Element from './Element'
const App = () => {
  const editor = useMemo(() => withImages(withHistory(withReact(createEditor()))),[])
  const initialValue = [
    {
      type: 'paragraph',
      children: [{text: ''}]
    }
  ];
  return (
    <Slate editor={editor} value={initialValue}>
      <Editable
        renderElement={props => <Element {...props} />}
        placeholder="Enter some text..."
        className='slate-editor'
      />
      <InsertImageButton />
    </Slate>
  )
}
const withImages = editor => {
  const { insertData, isVoid, isInline } = editor

  editor.isVoid = element => {
    return element.type === 'image' ? true : isVoid(element)
  }
  editor.isInline = element =>
    ['image'].includes(element.type) || isInline(element)

  editor.insertData = data => {
    const text = data.getData('text/plain')
    const { files } = data

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader()
        const [mime] = file.type.split('/')

        if (mime === 'image') {
          reader.addEventListener('load', () => {
            const url = reader.result
            insertImage(editor, url)
          })

          reader.readAsDataURL(file)
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}
const InsertImageButton = () => {
  const editor = useSlateStatic()
  return (
    <button
      className='img_btn'
      onMouseDown={ event => {
        event.preventDefault()
        insertImage(editor, '/image.png')
      }}
    >
      Insert Image
    </button>
  )
}
const insertImage = (editor, url) => {
  const text = {text: ''}
  const image = { type: 'image', url, children: [text] }
  Transforms.insertNodes(editor, image)
}

const isImageUrl = url => {
  if (!url) return false
  if (!isUrl(url)) return false
  const ext = new URL(url).pathname.split('.').pop()
  return imageExtensions.includes(ext)
}
export default App