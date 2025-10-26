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
        const QuillModule = await import('quill');
        const Quill = QuillModule.default;
        
        // Import and register font format
        const Font = await import('quill/formats/font');
        Quill.register(Font, true);

        if (!editorRef.current || quillRef.current) return;

        // Define the list of fonts
        const fontList = [
          'Helvetica', 
          'Arial', 
          'Times New Roman', 
          'Roboto', 
          'Open Sans',
          'Poppins',
          'Montserrat',
          'Lato', 
          'Calibri', 
          'Source Sans Pro'
        ];

        // Add font options to the toolbar
        const toolbarOptions = [
          [{ header: [1, 2, 3, false] }],
          [{ font: fontList }], // Font family dropdown with custom fonts
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link'],
          ['image', 'video'], // Image and video insertion
          ['undo', 'redo'], // Undo/redo buttons
          ['clean'],
        ];

        const quill = new Quill(editorRef.current, {
          theme: 'snow',
          readOnly,
          placeholder,
          modules: {
            toolbar: readOnly ? false : {
              container: toolbarOptions,
              handlers: {
                undo: function() {
                  quill.history.undo();
                },
                redo: function() {
                  quill.history.redo();
                }
              }
            },
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
          
          /* Font family styles */
          .ql-font-helvetica {
            font-family: Helvetica, Arial, sans-serif;
          }
          
          .ql-font-arial {
            font-family: Arial, Helvetica, sans-serif;
          }
          
          .ql-font-times-new-roman {
            font-family: "Times New Roman", Times, serif;
          }
          
          .ql-font-roboto {
            font-family: Roboto, Arial, sans-serif;
          }
          
          .ql-font-open-sans {
            font-family: "Open Sans", Arial, sans-serif;
          }
          
          .ql-font-poppins {
            font-family: Poppins, Arial, sans-serif;
          }
          
          .ql-font-montserrat {
            font-family: Montserrat, Arial, sans-serif;
          }
          
          .ql-font-lato {
            font-family: Lato, Arial, sans-serif;
          }
          
          .ql-font-calibri {
            font-family: Calibri, Arial, sans-serif;
          }
          
          .ql-font-source-sans-pro {
            font-family: "Source Sans Pro", Arial, sans-serif;
          }
          
          /* Custom icons for undo and redo */
          .ql-snow .ql-toolbar button.ql-undo,
          .ql-snow .ql-toolbar button.ql-redo {
            width: 28px;
          }

          .ql-snow .ql-toolbar button.ql-undo::before {
            content: "↺";
            font-size: 18px;
            font-weight: bold;
          }

          .ql-snow .ql-toolbar button.ql-redo::before {
            content: "↻";
            font-size: 18px;
            font-weight: bold;
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