import { getRepository, getCustomRepository, In } from 'typeorm';
import csv from 'csvtojson';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

import uploadConfig from '../config/upload';

interface CSVData {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Array<Transaction>> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const csvFilePath = path.resolve(uploadConfig.directory, fileName);

    const transactions: Array<CSVData> = await csv().fromFile(csvFilePath);

    const categories = transactions.map(transaction => {
      return transaction.category;
    });

    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    const categoriesToCreate = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoriesToCreate.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category_id: allCategories.find(
          category => category.title === transaction.category,
        )?.id,
      })),
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(csvFilePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
