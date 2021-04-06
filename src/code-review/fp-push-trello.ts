import {TrelloClient} from "trello.js";
import {config} from "../utils/config";
import {BoardList, Card, SimpleMember} from "../types";
import {cache} from "../utils/cache";
import process from 'process';
import path from 'path';
import nodeNotifier from "node-notifier";

const [, , ...args] = process.argv;

const [project, file, startLine, endLine, comment, content] = args.join(' ').split(';;;');

const boardId: string = config?.codeReview?.idBoard;

async function getOrCreateBoardList(trelloClient: TrelloClient, listName: string): Promise<BoardList> {

  const boardLists: BoardList[] = await trelloClient.boards.getBoardLists({id: boardId});

  const [boardList] = boardLists.filter(l => l.name === listName);

  if (!boardList) {
    return await trelloClient.boards.createBoardList({id: boardId, name: listName, pos: 'top'});
  }

  return boardList;
}


function getTodayDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month}-${day}`;
}

const TTL = 1000 * 60 * 60;


async function getMembers(trelloClient: TrelloClient): Promise<SimpleMember[]> {
  return cache.getOrInit('members', TTL, () => {
    return trelloClient.organizations.getOrganizationMembers({id: config.codeReview.idOrganization});
  });
}

async function getMember(trelloClient: TrelloClient, fullName: string) {
  const members = await getMembers(trelloClient);
  const [member] = members.filter(m => m.fullName === fullName);
  return member;
}

const upload = async function () {

  const trelloClient = new TrelloClient({key: config.trello.key, token: config.trello.token});
  const listName = getTodayDate();

  const boardList = await cache.getOrInit('currentList', TTL, () => getOrCreateBoardList(trelloClient, listName));

  const [user] = comment.split(' ');

  const member = await getMember(trelloClient, user);

  if (!member) {
    throw new Error(`Can not find member ${user}`);
  }

  await trelloClient.cards.createCard({
    idList: boardList.id,
    name: comment,
    desc: `
#### ${project}
${file}:${startLine}-${endLine}
> ${content}
    `,
    pos: "top",
    idMembers: [member.id]
  });
};

upload().then(() => {
  nodeNotifier.notify({
    title: `Upload success -- ${project}`,
    message: `${comment}`,
    icon: path.join(__dirname, '..', '..', 'images', 'icons8-ok.png')
  });
}).catch(e => {
  nodeNotifier.notify({
    title: `Upload failed -- ${project}`,
    message: `${e.toString()}`,
    icon: path.join(__dirname, '..', '..', 'images', 'icons8-cancel.png'),
    wait: true
  });
  throw e;
});

