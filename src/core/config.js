import { createContext, useContext, useState } from "react"

const AppConfigContext = createContext(null)

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState({
    dx: 30,
    dy: 22,
    timeStamp: 40,
    signalCount: 5,
    offsetY: 10,
    offsetX: 20,

    //Name div parameter
    indentPerLevel: 30,
    rulerHeight: 20,
    charWidth: 6.5,
    nameStart: 5,
  })

  const updateConfig = (updates) => {
    setConfig(prev => ({
      ...prev,
      ...updates
    }))
  }

  return (
    <AppConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext)
  if (!ctx) {
    throw new Error("useAppConfig must be used inside AppConfigProvider")
  }
  return ctx
}