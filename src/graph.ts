import csv from 'csv-parser';
import fs from 'fs';
import moment from 'moment';

import { graph, node, edge } from "./types"
const indice_id = 0;
const indice_company = 1;
const indice_line = 2;
const indice_departure_time = 3;
const indice_arrival_time = 4;
const indice_start = 5;
const indice_end = 6;
const indice_start_lat = 7;
const indice_start_lon = 8;
const indice_end_lat = 9;
const indice_end_lon = 10;



class Graph {
  lines: { [line: string]: { [node: string]: { [neighbour: string]: edge[] } } };
  nodes: { [node: string]: node };

  constructor(csv_data: any[]) {
    this.lines = {};
    this.nodes = {};
    this._build_graph(csv_data);
    this._sort_edges();
  }

  getGraph(): graph {
    return {
      lines: this.lines,
      nodes: this.nodes
    }
  }

  _build_graph(csv_data: any[]) {


    for (let row of csv_data) {
      //console.log(row)
      //console.log("end of rows")

      
      const start: string = row[indice_start];
      const end: string = row[indice_end];
      const line: string = row[indice_line];
      const start_departure: Date = row[indice_departure_time];
      const end_arrival: Date = row[indice_arrival_time];

      const edge: Edge = new Edge(start, end, line, start_departure, end_arrival);

      if (!(line in this.lines)) {
        this.lines[line] = {};
      }

      if (!(start in this.lines[line])) {
        this.lines[line][start] = {};
      }

      if (!(end in this.lines[line])) {
        this.lines[line][end] = {};
      }

      if (!(end in this.lines[line][start])) {
        this.lines[line][start][end] = [];
      }

      this.lines[line][start][end].push(edge);

      if (!(start in this.nodes)) {
        this.nodes[start] = new Node(start, row[indice_start_lat], row[indice_start_lon]);
      }

      if (!(end in this.nodes)) {
        this.nodes[end] = new Node(end, row[indice_end_lat], row[indice_end_lon]);
      }
    }
  }

  _sort_edges() {
    for (let [line, nodes] of Object.entries(this.lines)) {
      for (let [node, neighbours] of Object.entries(nodes)) {
        for (let [neighbour, edges_to_neighbour] of Object.entries(neighbours)) {
          edges_to_neighbour.sort(Edge.compare);
        }
      }
    }
  }

  neighbours(node: string): string[] {
    return Object.keys(this.nodes).filter((key) => key !== node);
  }

  get_node(name: string): node | null {
    return this.nodes[name] || null;
  }
}

class Node {
  name: string;
  lat: number;
  lon: number;

  constructor(name: string, latitude: number, longitude: number) {
    this.name = name;
    this.lat = latitude;
    this.lon = longitude;
  }
  isEqual(other: Node): boolean {
    return this.name === other.name;
  }

  getNode(): node {
    return {
      name: this.name,
      lat: this.lat,
      lon: this.lon
    }

  }
}



class Edge {
  start: string;
  stop: string;
  line: string;
  departureTime: Date;
  arrivalTime: Date;
  _timeSinceTimeZero: number | null;
  cost: number;

  constructor(start: string, end: string, line: string, departureTime: Date, arrivalTime: Date) {
    this.start = start;
    this.stop = end;
    this.line = line;
    this.departureTime = departureTime;
    this.arrivalTime = arrivalTime;
    this._timeSinceTimeZero = null;
    //console.log("tu jestem konstr Edge")
    this.cost = calcSec(departureTime, arrivalTime);
  }

  getEdge(): edge {
    return {
      start: this.start,
      stop: this.stop,
      line: this.line,
      departureTime: this.departureTime,
      arrivalTime: this.arrivalTime,
      timeSinceTimeZero: this.timeSinceTimeZero,
      cost: this.cost
    }

  }

  clearTimeSinceTimeZero(): void {
    this._timeSinceTimeZero = null;
  }

  timeSinceTimeZero(newTimeZero: Date): number {
    //console.log("tu jestem time zero since")
    //console.log(this.departureTime)
    //console.log(newTimeZero)

    if(this._timeSinceTimeZero === null) {
      this._timeSinceTimeZero = calcSec(newTimeZero, this.departureTime)
    }
    return this._timeSinceTimeZero;
  }

  compareTo(other: Edge): number {
    return this._timeSinceTimeZero! - other._timeSinceTimeZero!;
  }

  static compare(a: Edge, b: Edge): number {
    return a._timeSinceTimeZero! < b._timeSinceTimeZero! ? -1 : a._timeSinceTimeZero! > b._timeSinceTimeZero! ? 1 : 0;
  }

  toString(): string {
    return `line: "${this.line}", departure bus stop: "${this.start}", departure time: "${this.departureTime}", arrival bus stop: "${this.stop}", arrival time: "${this.arrivalTime}"`;
  }
}

function calcSec(start: Date, end: Date): number {

  //console.log("entering calcsec")
 // console.log(start)
  const startDate = new Date(start)
  const endDate = new Date(end)
 // console.log("startDate:" + startDate)
  const startSec = (startDate.getHours() * 60 + startDate.getMinutes()) * 60 + startDate.getSeconds();
  const endSec = (endDate.getHours() * 60 + endDate.getMinutes()) * 60 + endDate.getSeconds();
  // const endSec = (end.getHours() * 60 + end.getMinutes()) * 60 + end.getSeconds();
  const fullSec = 24 * 3600; // the number of seconds in a day
  if (startSec > endSec) {
    const diff = fullSec - (startSec - endSec);
   // console.log(diff)
    return diff;
  } else {
    const diff = endSec - startSec;
   // console.log(diff)
    return Math.floor(diff / 60);
  }
}

function printResult(path: Edge[] | null, startTime: string): void {
  const startDateTime = moment(startTime, "HH:mm:ss").toDate();
  const endDateTime = moment(path![path!.length - 1].arrivalTime, "HH:mm:ss").toDate();
  const totalSeconds = (endDateTime.getTime() - startDateTime.getTime()) / 1000;
  const totalMinutes = Math.round(totalSeconds / 60);
  let lineChanges = 0;
  let lineOfPrevEdge: string | undefined;
  if (path !== null) {
    lineOfPrevEdge = path[0].line;
    path.forEach(function (edge) {
      if (edge.line !== lineOfPrevEdge) {
        lineChanges += 1;
        lineOfPrevEdge = edge.line;
      }
    });
  }
  path.forEach(function (edge) {
   // console.log(edge);
  });
  console.log(`Whole trip will take ${totalMinutes} minutes across ${new Set(path!.map((edge) => edge.line)).size} lines and ${lineChanges} line changes`);
}

module.exports = { Graph, Node, Edge };
