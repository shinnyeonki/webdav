#pragma once
#include <iostream>
#include "Misc.h"

using namespace std;
class Container;
class Component
{
public:
	//생성자
	Component();
	Component(string,int,int,int,int);

	//가상함수
	virtual void repaint(HDC dc);
	virtual bool eventHandler(ActionEvent e);
	virtual bool includes(MPoint);

	//
	void setContainer(Container* c);
	void setSize(int, int);
	void setBound(int, int, int, int);
	int getPosX();
	int getPosY();
	void setPosX(int);
	void setPosY(int);
	string getName();

protected:
	Container* container_;
	MPoint pos;
	int posx;
	int posy;
	int width_;
	int height_;
	string name_;
	static const int BOX_WIDTH = 100;
	static const int BOX_HEIGHT = 75;
};

