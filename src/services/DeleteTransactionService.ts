import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    // validar se o obj existe
    const existTransaction = await transactionRepository.findOne(id);

    // se nao existir error
    if (!existTransaction) {
      throw new AppError("The transaction doesn't exist");
    }

    // se existir, deletar
    await transactionRepository.delete(id);
  }
}

export default DeleteTransactionService;
