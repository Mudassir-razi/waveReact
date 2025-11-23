import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

export default function SignalEditor({ value, onChange, viewMode, editorRef }) {
  const monacoRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    // External reference for parent
    if (editorRef) editorRef.current = editor;
    monacoRef.current = monaco;

    // Force initial layout
    setTimeout(() => editor.layout(), 0);

    // Fix: Observe container size and relayout editor
    const container = editor.getDomNode();
    const ro = new ResizeObserver(() => {
      editor.layout();
    });
    ro.observe(container);

    editor._ro = ro; // store observer for cleanup
  };

  // Theme switching
  useEffect(() => {
    if (!monacoRef.current) return;

    monacoRef.current.editor.defineTheme("my-theme", {
      base: viewMode ? "vs" : "vs-dark",
      inherit: true,
      rules: [],      // IMPORTANT: no highlighting rules
      colors: {},
    });

    monacoRef.current.editor.setTheme("my-theme");
  }, [viewMode]);

  // Cleanup ResizeObserver on unmount
  useEffect(() => {
    return () => {
      const editor = editorRef?.current;
      if (editor && editor._ro) editor._ro.disconnect();
    };
  }, []);

  return (
    <Editor
      language="javascript"
      value={value}
      onChange={onChange}
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: false,  // ❗ FIX: Important
        tabSize: 2,
        formatOnType: false,
        formatOnPaste: false,
      }}
    />
  );
}
