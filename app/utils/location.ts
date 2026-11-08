type LocationResponse = {
  data?: unknown
}

type LocationResult = Record<string, unknown>

function pickLocationResult(payload: unknown): LocationResult | undefined {
  const responseData = (payload as LocationResponse)?.data

  if (!responseData) return undefined
  if (typeof responseData !== 'object') return undefined

  const data = responseData as LocationResult
  if (data.data && typeof data.data === 'object') return data.data as LocationResult
  if (data.result && typeof data.result === 'object') return data.result as LocationResult
  return data
}

function pickText(result: LocationResult, keys: string[]) {
  for (const key of keys) {
    const value = result[key]
    if (typeof value === 'string' && value) return value
  }
  return ''
}

function getLocationText(result?: LocationResult) {
  if (!result) return ''

  const province = pickText(result, ['province', 'Province', 'region', 'Region', 'subdivisions', 'pro'])
  const city = pickText(result, ['city', 'City', 'cityName'])
  const country = pickText(result, ['country', 'Country', 'countryName'])

  return [province, city].filter(Boolean).join(' ') || country || ''
}

async function getLocation() {
  try {
    // 同源代理到 moments-api
    const response = await fetch('/api/location', {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('获取 IP 地址服务响应失败')
    }

    const payload = await response.json()
    const result = pickLocationResult(payload)

    return {
      result,
      text: getLocationText(result),
    }
  } catch (error) {
    console.error('获取 IP 地址失败:', error)
  }
}

export { getLocation }
