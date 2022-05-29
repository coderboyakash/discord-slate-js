import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Transforms, createEditor, Editor, Range } from 'slate'
import {Slate,Editable,useSlateStatic,useFocused,withReact,ReactEditor} from 'slate-react'
import { withHistory } from 'slate-history'
import imageExtensions from 'image-extensions'
import isUrl from 'is-url'
import Element from './Element'
import Portal from './Portal'
const App = () => {
  const ref = useRef()
  const [target, setTarget] = useState()
  const [tagMode, setTagMode] = useState(false)
  const [mentionMode, setMentionMode] = useState(false)
  const [index, setIndex] = useState(0)
  const [search, setSearch] = useState('')
  const editor = useMemo(() => withMentions(withImages(withHistory(withReact(createEditor())))),[])
  const initialValue = [
    {
      type: 'paragraph',
      children: [{text: ''}]
    }
  ];
  const onKeyDown = useCallback(
    event => {
      if (target) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault()
            let prevIndex = 0;
            if(mentionMode){
              prevIndex = index >= mentions.length - 1 ? 0 : index + 1
            }
            if(tagMode){
              prevIndex = index >= tags.length - 1 ? 0 : index + 1
            }
            setIndex(prevIndex)
            break
          case 'ArrowUp':
            event.preventDefault()
            let nextIndex = 0;
            if(mentionMode){
              nextIndex = index >= mentions.length - 1 ? 0 : index + 1
            }
            if(tagMode){
              nextIndex = index >= tags.length - 1 ? 0 : index + 1
            }
            // const nextIndex = index <= 0 ? chars.length - 1 : index - 1
            setIndex(nextIndex)
            break
          case 'Tab':
          case 'Enter':
            event.preventDefault()
            Transforms.select(editor, target)
            if(mentionMode){
              console.log('men');
              insertMention(editor, mentions[index])
            }
            if(tagMode){
              console.log('tag', tags[index]);
              insertTag(editor, tags[index])
            }
            setTarget(null)
            break
          case 'Escape':
            event.preventDefault()
            setTarget(null)
            break
        }
      }
    },
    [index, search, target]
  )
  const mentions = CHARACTERS.filter(c =>
    c.toLowerCase().startsWith(search.toLowerCase())
  ).slice(0, 10)
  const tags = TAGS.filter(c =>
    c.toLowerCase().startsWith(search.toLowerCase())
  ).slice(0, 10)
  useEffect(() => {
    if (target && (mentions.length > 0 || tags.lengths > 0)) {
      const el = ref.current
      const domRange = ReactEditor.toDOMRange(editor, target)
      const rect = domRange.getBoundingClientRect()
      el.style.top = `${rect.top + window.pageYOffset + 24}px`
      el.style.left = `${rect.left + window.pageXOffset}px`
    }
  }, [mentions.length, tags.lengths, editor, index, search, target])
  return (
    <Slate 
      editor={editor} 
      value={initialValue}
      onChange={() => {
        const { selection } = editor

        if (selection && Range.isCollapsed(selection)) {
          const [start] = Range.edges(selection)
          const wordBefore = Editor.before(editor, start, { unit: 'word' })
          const before = wordBefore && Editor.before(editor, wordBefore)
          const beforeRange = before && Editor.range(editor, before, start)
          const beforeText = beforeRange && Editor.string(editor, beforeRange)
          if(beforeText && beforeText.match(/^@(\w+)$/)){
            setTagMode(false)
            setMentionMode(true)
          }
          if(beforeText && beforeText.match(/^#(\w+)$/)){
            setTagMode(true)
            setMentionMode(false)
          }
          // console.log('#', beforeText && beforeText.match(/^#(\w+)$/))
          const beforeMatch = beforeText && (beforeText.match(/^@(\w+)$/) || beforeText.match(/^#(\w+)$/))
          const after = Editor.after(editor, start)
          const afterRange = Editor.range(editor, start, after)
          const afterText = Editor.string(editor, afterRange)
          const afterMatch = afterText.match(/^(\s|$)/)

          if (beforeMatch && afterMatch) {
            setTarget(beforeRange)
            setSearch(beforeMatch[1])
            setIndex(0)
            return
          }
        }

        setTarget(null)
      }}
      >
      <Editable
        renderElement={props => <Element {...props} />}
        placeholder="Enter some text..."
        className='slate-editor'
        onKeyDown={onKeyDown}
      />
      {mentionMode && target && mentions.length > 0 && (
        <Portal>
          <div
            ref={ref}
            style={{
              top: '-9999px',
              left: '-9999px',
              position: 'absolute',
              zIndex: 1,
              padding: '3px',
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 5px rgba(0,0,0,.2)',
            }}
            data-cy="mentions-portal"
          >
            {mentions.map((mention, i) => (
              <div
                key={mention}
                style={{
                  padding: '1px 3px',
                  borderRadius: '3px',
                  background: i === index ? '#B4D5FF' : 'transparent',
                }}
              >
                {mention}
              </div>
            ))}
          </div>
        </Portal>
      )}
      {tagMode && target && tags.length > 0 && (
        <Portal>
          <div
            ref={ref}
            style={{
              top: '-9999px',
              left: '-9999px',
              position: 'absolute',
              zIndex: 1,
              padding: '3px',
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 5px rgba(0,0,0,.2)',
            }}
            data-cy="mentions-portal"
          >
            {tags.map((tag, i) => (
              <div
                key={tag}
                style={{
                  padding: '1px 3px',
                  borderRadius: '3px',
                  background: i === index ? '#B4D5FF' : 'transparent',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </Portal>
      )}
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
const withMentions = editor => {
  const { isInline, isVoid } = editor

  editor.isInline = element => {
    return (element.type === 'mention' || element.type === 'tag') ? true : isInline(element)
  }

  editor.isVoid = element => {
    return (element.type === 'mention' || element.type === 'tag') ? true : isVoid(element)
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
  Transforms.move(editor)
}

const insertMention = (editor, character) => {
  const mention = {
    type: 'mention',
    character,
    children: [{ text: '' }],
  }
  Transforms.insertNodes(editor, mention)
  Transforms.move(editor)
}
const insertTag = (editor, character) => {
  const tag = {
    type: 'tag',
    character,
    children: [{ text: '' }],
  }
  Transforms.insertNodes(editor, tag)
  Transforms.move(editor)
}

const isImageUrl = url => {
  if (!url) return false
  if (!isUrl(url)) return false
  const ext = new URL(url).pathname.split('.').pop()
  return imageExtensions.includes(ext)
}
const CHARACTERS = [
  'Aayla Secura',
  'Adi Gallia'
]
const TAGS = [
  'Aayla Secura Tag',
  'Adi Gallia Tag'
]
export default App