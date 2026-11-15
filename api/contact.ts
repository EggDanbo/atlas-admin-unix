import { http } from '@/api/http'

const url = 'atlas/contact'

export interface ContactMember {
  id: string
  name: string
  role: string
  phone: string
  email: string
}

export interface ContactGroup {
  id: string
  name: string
  members: ContactMember[]
}

export default {
  /** 通讯录（按部门分组） */
  list: () => {
    return http.get<ServiceResult<ContactGroup[]>>(`${url}/list`)
  },
}
