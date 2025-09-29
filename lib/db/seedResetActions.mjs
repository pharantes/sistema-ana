import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose";
import dbConnect from "./connect.js";
import Action from "./models/Action.js";

function brDate(isoLike) {
  // isoLike: '2025-09-01'
  return new Date(isoLike);
}

function reais(n) {
  return Math.round(n * 100) / 100;
}

async function seed() {
  await dbConnect();

  // 1) purge
  const del = await Action.deleteMany({});
  console.log(`Deleted ${del.deletedCount} existing actions.`);

  const clients = [
    "BAND",
    "OUT PROMO",
    "UBERLÂNDIA REFRESCO",
    "GLOBEX",
    "INITECH",
    "WAYNE ENTERPRISES",
    "STARK INDUSTRIES",
    "WONKA",
    "HOOLI",
    "SOYLENT",
  ];

  const paymentMethods = ["PIX", "TED", "DINHEIRO", "BOLETO"];

  const staffPeople = [
    { name: "EMY CARLA FERREIRA ALVES", bank: "PIC PAY" },
    { name: "Yasmim Karoline Ramos Silva", bank: "branco do brasil" },
    { name: "MARIA CLAUDIA DE PAIVA BORGES", bank: "NUBANK" },
    { name: "Geovanna Gabryelly Castro Dias", bank: "NUBANK" },
    { name: "Jesus da Prado Martins Pereira", bank: "NUBANK" },
    { name: "BRUNA LEAL MENARDELLI", bank: "nubank" },
    { name: "CINARA LIMA DE ARAUJO", bank: "NUBANK" },
    { name: "Thayanna Gama", bank: "caixa" },
    { name: "Mayara Andrade Vieira", bank: "santander" },
    { name: "Brenda Clarice Rodrigues Gomes", bank: "Nubank" },
  ];

  // simple pix generator
  const pixFor = (i) => String(700000000000 + i);

  // events pool
  const events = [
    "pedágio",
    "Amystel",
    "Monster",
    "coca cola",
    "campanha",
    "promoção",
  ];

  const actions = [];
  const baseDate = new Date();

  for (let i = 0; i < 30; i++) {
    const client = clients[i % clients.length];
    const paymentMethod = paymentMethods[i % paymentMethods.length];
    const event = events[i % events.length];

    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - (30 - i));
    const dueDate = new Date(date);
    dueDate.setDate(date.getDate() + 15);

    // choose 1-3 staff entries
    const staffCount = 1 + (i % 3);
    const s = [];
    for (let k = 0; k < staffCount; k++) {
      const person = staffPeople[(i + k) % staffPeople.length];
      const value = reais(60 + (i * 7 + k * 20) % 260); // values like 60,80,160,300 etc
      s.push({
        name: person.name,
        value,
        pix: pixFor(i * 10 + k),
        bank: person.bank,
      });
    }

    actions.push({
      name: event,
      event,
      client,
      date,
      paymentMethod,
      dueDate,
      staff: s,
      createdBy: i % 2 === 0 ? "admin" : "staff",
    });
  }

  await Action.insertMany(actions);
  console.log(`Inserted ${actions.length} actions.`);

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});
