import { getToken } from "../resources/rotate"


test('Test getToken', async () => {
 const token = getToken()
  
 expect(token).toBeDefined
})

  