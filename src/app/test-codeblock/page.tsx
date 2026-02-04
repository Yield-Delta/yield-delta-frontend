import { CodeBlock } from '@/components/docs/CodeBlock'

export default function TestCodeBlockPage() {
  const jsCode = `const response = await fetch('https://www.yielddelta.xyz/api/ai/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  },
})
const { data } = await response.json()
console.log('Created vault:', data.address)`

  const bashCode = `npm install --save @yield-delta/sdk
git clone "https://github.com/example/repo.git"
echo 'Hello World'`

  const jsonCode = `{
  "vaultAddress": "0xf6A791e47733a773A60083aA29aaC9c3bA5E900974fEx",
  "currentPrice": 0.485,
  "volume24h": 15678234,
  "isActive": true
}`

  const jsLineNumbers = `import { ethers } from "ethers"

const provider = new ethers.JsonRpcProvider("https://evm-rpc-arctic-1.sei-apis.com")
const contract = new ethers.Contract(address, abi, provider)`

  return (
    <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">CodeBlock Component Test</h1>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Test 1: JavaScript - Strings with Quotes</h2>
          <p className="text-gray-300 mb-4">
            Expected: Strings should be green, keywords purple, no HTML entities visible
          </p>
          <CodeBlock code={jsCode} language="javascript" />
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Test 2: Bash Commands</h2>
          <p className="text-gray-300 mb-4">
            Expected: Keywords green, strings green, no HTML tags visible
          </p>
          <CodeBlock code={bashCode} language="bash" />
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Test 3: JSON Data</h2>
          <p className="text-gray-300 mb-4">
            Expected: Property names blue, strings green, numbers orange, brackets gray
          </p>
          <CodeBlock code={jsonCode} language="json" />
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Test 4: JavaScript with Line Numbers</h2>
          <p className="text-gray-300 mb-4">
            Expected: Line numbers visible on left, syntax highlighting applied
          </p>
          <CodeBlock code={jsLineNumbers} language="javascript" showLineNumbers={true} />
        </div>

        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3 text-green-400">Validation Checklist:</h3>
          <ul className="space-y-2 text-green-200">
            <li>✓ No HTML tags visible (no class=&quot;...&quot;)</li>
            <li>✓ No HTML entities visible (no &amp;#039;, &amp;quot;, etc.)</li>
            <li>✓ Strings are highlighted in green</li>
            <li>✓ Keywords are highlighted in purple</li>
            <li>✓ Numbers are highlighted in orange</li>
            <li>✓ Functions are highlighted in blue</li>
            <li>✓ Properties are highlighted in cyan</li>
            <li>✓ Line numbers display correctly</li>
            <li>✓ Can copy code without HTML artifacts</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
