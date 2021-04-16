import {TrelloClient} from "trello.js";
import {Config, config} from "../utils/config";
import {BoardList, SimpleMember} from "../types";
import {cache} from "../utils/cache";
import process from 'process';
import path from 'path';
import nodeNotifier from "node-notifier";

const [, , ...args] = process.argv;

const [project, file, startLine, endLine, comment, content] = args.join(' ').split(';;;');

async function getOrCreateBoardList(trelloClient: TrelloClient, listName: string, idBoard: string): Promise<BoardList> {

  const boardLists: BoardList[] = await trelloClient.boards.getBoardLists({id: idBoard});

  const [boardList] = boardLists.filter(l => l.name === listName);

  if (!boardList) {
    return await trelloClient.boards.createBoardList({id: idBoard, name: listName, pos: 'top'});
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

async function getBoardMembers(trelloClient: TrelloClient, idBoard: string): Promise<SimpleMember[]> {
  return cache.getOrInit(`board/${idBoard}/members`, TTL, () => {
    return trelloClient.boards.getBoardMembers({id: idBoard});
  });
}

async function getBoardMember(trelloClient: TrelloClient, fullName: string, idBoard: string) {
  const members = await getBoardMembers(trelloClient, idBoard);
  const [member] = members.filter(m => m.fullName === fullName);
  return member;
}

async function upload(localConfig: Config) {
  const boardId: string = localConfig?.codeReview?.idBoard;
  const trelloClient = new TrelloClient({key: config.trello.key, token: localConfig.trello?.token});
  const listName = getTodayDate();
  const boardList = await cache.getOrInit(`board/${boardId}/list/${listName}`, TTL, () => getOrCreateBoardList(trelloClient, listName, boardId));
  const [user] = comment.split(' ');
  const member = await getBoardMember(trelloClient, user, localConfig.codeReview?.idBoard);
  if (!member) {
    throw new Error(`Can not find member ${user}`);
  }

  return  trelloClient.cards.createCard({
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

upload(config).then(() => {
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

