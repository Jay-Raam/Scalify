import { ApolloProvider } from '@apollo/client'
import { Toaster } from 'react-hot-toast'
import { apolloClient } from '@/lib/apolloClient'
import { ChatPageV2 } from '@/pages/ChatPageV2'
import './App.css'

export default function App() {
    return (
        <ApolloProvider client={apolloClient}>
            <ChatPageV2 />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#000',
                        color: '#fff',
                        borderRadius: '0',
                        fontSize: '13px',
                        border: '1px solid #fff',
                        fontFamily: 'monospace',
                    },
                    success: {
                        style: {
                            background: '#000',
                            color: '#fff',
                            border: '1px solid #fff',
                        },
                    },
                    error: {
                        style: {
                            background: '#000',
                            color: '#ff0000',
                            border: '1px solid #ff0000',
                        },
                    },
                }}
            />
        </ApolloProvider>
    )
}
