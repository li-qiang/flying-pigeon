export type BoardList = {
  id: string,
  name: string,
  closed: boolean,
  pos: number,
  softLimit: any,
  idBoard: string,
  subscribed: boolean
}

export type Card = {
  id: string,
  name: string,
  closed: boolean,
  idShort: number,
}

export type SimpleMember = {
  id: string,
  username: string,
  fullName: string,
}

