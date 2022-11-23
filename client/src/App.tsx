import * as React from 'react'
import { useState, Suspense, useEffect } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import './editor/vscode.css'
import './App.css'
import Notification from './Notification'
import { LeanClient } from './editor/leanclient'
import PrivacyPolicy from './PrivacyPolicy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faArrowRotateRight, faArrowUpRightFromSquare, faDownload } from '@fortawesome/free-solid-svg-icons'
import Editor from './Editor'
import Logo from "./logo.svg";
import { saveAs } from 'file-saver';
import LoadUrl from './LoadUrl'
import { monacoSetup } from './editor/monacoSetup'

const socketUrl = ((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + "/websocket"

monacoSetup()

const App: React.FC = () => {
  const [content, setContent] = useState<string>('')
  const [url, setUrl] = useState<string>(null)
  const [client, setClient] = useState<LeanClient>(null)
  const [contentFromUrl, setContentFromUrl] = useState<string>(null)
  const [restartMessage, setRestartMessage] = useState<boolean | null>(false)

  const readHash = () => {
    if (window.location.hash.startsWith('#code=')) {
      setContent(decodeURIComponent(window.location.hash.substring(6)));
    }
    if (window.location.hash.startsWith('#url=')) {
      setUrl(decodeURIComponent(window.location.hash.substring(5)));
    }
  }
  if ("onhashchange" in window) // does the browser support the hashchange event?
    window.addEventListener('hashchange', readHash)

  useEffect(() => { readHash(); }, []) // Trigger onhashchange once in the beginning

  useEffect(() => {
    let client = new LeanClient(socketUrl, undefined, uri, showRestartMessage)
    setClient(client)
    client.start()

    const cleanup = async () => {
      await client.stop();
    }
    return () => { cleanup() }
  }, [])

  useEffect(() => {
    if (contentFromUrl === content) {
      history.replaceState(undefined, undefined, '#url=' + encodeURIComponent(url));
    } else if (content === "") {
      history.replaceState(undefined, undefined, ' ');
    } else {
      history.replaceState(undefined, undefined, '#code=' + encodeURIComponent(content));
    }
  }, [content])

  useEffect(() => {
    if (url !== null) {
      setContent("Loading...")
      setContentFromUrl("Loading...")
      fetch(url)
      .then((response) => response.text())
      .then((content) => {
        setContent(content)
        setContentFromUrl(content)
      })
      .catch( err => {
        setContent(err.toString())
        setContentFromUrl(err.toString())
      })
    }
  }, [url])

  const onDidChangeContent = (newContent) => {
    setContent(newContent)
  }

  const save = () => {
    var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "LeanProject.lean");
  }

  const loadFileFromDisk = (event) => {
    const fileToLoad = event.target.files[0]
    var fileReader = new FileReader();
    fileReader.onload = (fileLoadedEvent) => {
        var textFromFileLoaded = fileLoadedEvent.target.result as string;
        setContent(textFromFileLoaded)
    };

    fileReader.readAsText(fileToLoad, "UTF-8");
  }

  const loadFromUrl = (url) => {
    setUrl((oldUrl) => {
      if (oldUrl === url) {
        setContent(contentFromUrl)
      }
      return url
    })
  }

  const showRestartMessage = () => {
    setRestartMessage(true)
  }

  const restart = async () => {

  }

  const uri = monaco.Uri.parse('file:///LeanProject/LeanProject.lean')

  return (
    <div className='app'>
      <div className='nav'>
        <Logo className='logo' />
        <label htmlFor="file-upload" className="nav-link">
          <FontAwesomeIcon icon={faUpload} /> Load file from disk
        </label>
        <LoadUrl loadFromUrl={loadFromUrl} />
        <input id="file-upload" type="file" onChange={loadFileFromDisk} />
        <span className="nav-link" onClick={save}>
          <FontAwesomeIcon icon={faDownload} /> Save file
        </span>
        <span className="nav-link" onClick={restart}>
          <FontAwesomeIcon icon={faArrowRotateRight} /> Restart server
        </span>
        <PrivacyPolicy />
        <a className="nav-link" href="https://leanprover.github.io/lean4/doc/" target="_blank">
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> Lean documentation
        </a>
        <a className="nav-link" href="https://github.com/hhu-adam/lean4web" target="_blank">
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> GitHub
        </a>
      </div>
      <Suspense fallback={<div className="loading-ring"></div>}>
        <Editor value={content} onDidChangeContent={onDidChangeContent} client={client} uri={uri} />
      </Suspense>
      {restartMessage ?
        <Notification
          restart={() => {setRestartMessage(false); restart()} }
          close={() => {setRestartMessage(false)}} />
        : ''}
    </div>
  )
}

export default App
