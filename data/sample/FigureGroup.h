#pragma once
#include "figure.h"
#include <list>

class FigureGroup : public Figure
{
public:
	FigureGroup();
	void draw(HDC) override;
	void move(int,int) override;
	void push(Figure* f);
	void setSize();
	std::list<Figure*> groupFg;
};

