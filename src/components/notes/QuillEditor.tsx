'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export interface QuillEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
}

export const QuillEditor = forwardRef<QuillEditorRef, QuillEditorProps>(
  ({ value = '', onChange, placeholder = 'Start writing...', className = '', readOnly = false }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return quillRef.current?.root.innerHTML || '';
      },
      setContent: (content: string) => {
        if (quillRef.current) {
          quillRef.current.root.innerHTML = content;
        }
      },
    }));

    useEffect(() => {
      if (!editorRef.current) return;

      // Dynamically import Quill to avoid SSR issues
      const initQuill = async () => {
        const Quill = (await import('quill')).default;

        if (!editorRef.current || quillRef.current) return;

        const quill = new Quill(editorRef.current, {
          theme: 'snow',
          readOnly,
          placeholder,
          modules: {
            toolbar: readOnly ? false : [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ color: [] }, { background: [] }],
              [{ align: [] }],
              ['blockquote', 'code-block'],
              ['link'],
              ['clean'],
            ],
          },
        });

        // Set initial content
        if (value) {
          quill.root.innerHTML = value;
        }

        // Handle changes
        quill.on('text-change', () => {
          const html = quill.root.innerHTML;
          onChange?.(html);
        });

        quillRef.current = quill;
      };

      initQuill();

      // Cleanup
      return () => {
        if (quillRef.current) {
          quillRef.current = null;
        }
      };
    }, []);

    // Update content when value prop changes
    useEffect(() => {
      if (quillRef.current && value !== quillRef.current.root.innerHTML) {
        const selection = quillRef.current.getSelection();
        quillRef.current.root.innerHTML = value;
        if (selection) {
          quillRef.current.setSelection(selection);
        }
      }
    }, [value]);

    // Update readOnly state
    useEffect(() => {
      if (quillRef.current) {
        quillRef.current.enable(!readOnly);
      }
    }, [readOnly]);

    return (
      <div className={`quill-wrapper ${className}`}>
        <div ref={editorRef} />
        <style jsx global>{`
          .quill-wrapper {
            height: 100%;
            display: flex;
            flex-direction: column;
            
          }
          .quill-wrapper .ql-container {
            flex: 1;
            overflow-y: auto;
            font-size: 16px;
            border: none;
            outline: none;
          }
          .quill-wrapper .ql-editor {
            min-height: 200px;
            padding: 12px 15px;
            border: none;
            outline: none;
          }
          .quill-wrapper .ql-editor:focus {
            outline: none;
            border: none;
          }
          .quill-wrapper .ql-toolbar {
            background: hsl(var(--muted));
            border: none;
            border-bottom: 1px solid hsl(var(--border));
            outline: none;
          }
          .quill-wrapper .ql-container {
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
          }
          .quill-wrapper.readonly .ql-toolbar {
            display: none;
          }
          .quill-wrapper.readonly .ql-container {
            border: none;
            outline: none;
          }
          .quill-wrapper.readonly .ql-editor {
            padding: 0;
            border: none;
            outline: none;
          }
          
          /* Dark mode support */
          .dark .ql-toolbar {
            background: hsl(var(--muted));
          }
          .dark .ql-stroke {
            stroke: hsl(var(--foreground));
          }
          .dark .ql-fill {
            fill: hsl(var(--foreground));
          }
          .dark .ql-picker-label {
            color: hsl(var(--foreground));
          }
          .dark .ql-editor.ql-blank::before {
            color: hsl(var(--muted-foreground));
          }
        `}</style>
      </div>
    );
  }
);

QuillEditor.displayName = 'QuillEditor';
