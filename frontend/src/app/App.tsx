import { Router } from "./router"
import { Providers } from "./providers/Providers" 

export function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  )
}
