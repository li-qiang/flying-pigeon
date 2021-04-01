import {TrelloClient} from "trello.js";
import {config} from "../utils/config";
import {BoardList, Card, SimpleMember} from "../types";
import {cache} from "../utils/cache";
import process from 'process';
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


async function getMembers(trelloClient: TrelloClient): Promise<SimpleMember[]> {
  return cache.getOrInit('members', 1000 * 60 * 60, () => {
    return trelloClient.organizations.getOrganizationMembers({id: config.codeReview.idOrganization});
  });
}

async function getMember(trelloClient: TrelloClient, fullName: string) {
  const members = await getMembers(trelloClient);
  const [member] = members.filter(m => m.fullName === fullName);
  return member;
}

(async function () {

  const trelloClient = new TrelloClient({key: config.trello.key, token: config.trello.token});
  const listName = getTodayDate();

  const boardList = await getOrCreateBoardList(trelloClient, listName);

  const [user] = comment.split(' ');

  const member = await getMember(trelloClient, user);

  const card: Card = await trelloClient.cards.createCard({
    idList: boardList.id,
    name: comment,
    desc: `
# ${project}
## ${file}:${startLine}-${endLine}
> ${content}
    `,
    pos: "top",
    idMembers: [member.id]
  })

  nodeNotifier.notify({
    title: `Upload success -- ${project}`,
    message: `${comment}`
  });
})();

