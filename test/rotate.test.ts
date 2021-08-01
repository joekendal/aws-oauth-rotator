import { getToken } from "../resources/rotate"


test('getToken', async () => {
 const token = await getToken()
 expect(token).toBeDefined()
})

  