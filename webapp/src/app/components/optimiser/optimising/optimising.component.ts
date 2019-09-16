import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/api.service';

@Component({
  selector: 'app-optimising',
  templateUrl: './optimising.component.html',
  styleUrls: ['./optimising.component.css']
})
export class OptimisingComponent implements OnInit {

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getClass('hehe');
  }

}
